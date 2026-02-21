class RLHFTrainer:
    def __init__(self, args):
        t.manual_seed(args.seed)
        self.args = args
        self.model = HookedTransformerWithValueHead.from_pretrained(args.base_model).to(device).train()
        self.ref_model = HookedTransformer.from_pretrained(args.base_model).to(device).eval()
        self.optimizer, self.scheduler = get_optimizer_and_scheduler(self.args, self.model)
        self.prefix_len = len(self.model.to_str_tokens(self.args.prefix, prepend_bos=self.args.prepend_bos))

    def compute_rlhf_objective(self, minibatch):
        gen_len_slice = slice(-self.args.gen_len - 1, -1)

        logits, values = self.model.forward_with_value_head(minibatch.sample_ids)
        logprobs = get_logprobs(logits, minibatch.sample_ids, self.prefix_len)

        clipped_surrogate_objective = calc_clipped_surrogate_objective(
            logprobs, minibatch.logprobs, minibatch.advantages, self.args.clip_coef, self.args.gen_len,
        )
        value_loss = calc_value_function_loss(
            values[:, gen_len_slice], minibatch.returns, self.args.vf_coef, self.args.gen_len
        )
        entropy_bonus = calc_entropy_bonus(logits[:, gen_len_slice], self.args.ent_coef, self.args.gen_len)
        kl_penalty = calc_kl_penalty(
            logits[:, gen_len_slice], minibatch.ref_logits[:, gen_len_slice], self.args.kl_coef, self.args.gen_len,
        )

        ppo_objective_fn = clipped_surrogate_objective - value_loss + entropy_bonus
        return ppo_objective_fn - kl_penalty

    def rollout_phase(self):
        sample_ids, samples = get_samples(
            self.model, prompt=self.args.prefix, batch_size=self.args.batch_size,
            gen_len=self.args.gen_len, temperature=self.args.temperature,
            top_k=self.args.top_k, prepend_bos=self.args.prepend_bos,
        )

        with t.inference_mode():
            logits, values = self.model.forward_with_value_head(sample_ids)
            ref_logits = self.ref_model(sample_ids)

        logprobs = get_logprobs(logits, sample_ids, self.prefix_len)
        rewards = self.args.reward_fn(samples)
        rewards_normed = normalize_reward(rewards) if self.args.normalize_reward else rewards
        advantages = compute_advantages(values, rewards_normed, self.prefix_len)

        return ReplayMemory(
            args=self.args, sample_ids=sample_ids, logprobs=logprobs,
            advantages=advantages, values=values, ref_logits=ref_logits,
        )

    def learning_phase(self, memory):
        for minibatch in memory.get_minibatches():
            self.optimizer.zero_grad()
            total_objective_function = self.compute_rlhf_objective(minibatch)
            total_objective_function.backward()
            nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=self.args.max_grad_norm)
            self.optimizer.step()
            self.step += 1
        self.scheduler.step()

    def train(self):
        self.step = 0
        for self.phase in range(self.args.total_phases):
            memory = self.rollout_phase()
            self.learning_phase(memory)
