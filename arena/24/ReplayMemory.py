class ReplayMemory:
    def __init__(self, args, sample_ids, logprobs, advantages, values, ref_logits):
        self.args = args
        self.sample_ids = sample_ids
        self.logprobs = logprobs
        self.advantages = advantages
        self.values = values
        self.ref_logits = ref_logits

    def get_minibatches(self):
        minibatches = []

        returns = self.advantages + self.values[:, -self.args.gen_len - 1 : -1]

        for _ in range(self.args.batches_per_learning_phase):
            for indices in t.randperm(self.args.batch_size).reshape(self.args.num_minibatches, -1):
                minibatches.append(
                    ReplayMinibatch(
                        sample_ids=self.sample_ids[indices],
                        logprobs=self.logprobs[indices],
                        advantages=self.advantages[indices],
                        returns=returns[indices],
                        ref_logits=self.ref_logits[indices],
                    )
                )

        return minibatches
