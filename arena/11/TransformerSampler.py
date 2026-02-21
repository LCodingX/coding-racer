class TransformerSampler:
    def __init__(self, model, tokenizer):
        self.model = model
        self.cfg = model.cfg
        self.tokenizer = tokenizer

    @t.inference_mode()
    def sample(self, prompt, max_tokens_generated=100, **kwargs):
        self.model.eval()
        input_ids = self.tokenizer.encode(prompt, return_tensors="pt").to(device)[0]

        for _ in range(max_tokens_generated):
            logits = self.model(input_ids[None, -self.cfg.n_ctx :])
            logits = logits[0, -1]
            next_token = t.tensor(
                [TransformerSampler.sample_next_token(input_ids, logits, **kwargs)], device=device
            )
            input_ids = t.cat([input_ids, next_token], dim=-1)
            if next_token == getattr(self.tokenizer, "eos_token_id", None):
                break

        return self.tokenizer.decode(input_ids)

    @staticmethod
    def sample_next_token(input_ids, logits, temperature=1.0, top_k=0, top_p=0.0, frequency_penalty=0.0, seed=None):
        assert input_ids.ndim == 1
        assert temperature >= 0

        if seed is not None:
            t.manual_seed(seed)
            np.random.seed(seed)

        if temperature == 0:
            return TransformerSampler.greedy_search(logits)
        elif temperature != 1.0:
            logits = TransformerSampler.apply_temperature(logits, temperature)
        if frequency_penalty != 0.0:
            logits = TransformerSampler.apply_frequency_penalty(input_ids, logits, frequency_penalty)
        if top_k > 0:
            return TransformerSampler.sample_top_k(logits, top_k)
        if top_p > 0.0:
            return TransformerSampler.sample_top_p(logits, top_p)
        return TransformerSampler.sample_basic(logits)

    @staticmethod
    def greedy_search(logits):
        return logits.argmax().item()

    @staticmethod
    def apply_temperature(logits, temperature):
        return logits / temperature

    @staticmethod
    def apply_frequency_penalty(input_ids, logits, freq_penalty):
        d_vocab = logits.size(0)
        id_freqs = t.bincount(input_ids, minlength=d_vocab)
        return logits - freq_penalty * id_freqs

    @staticmethod
    def sample_basic(logits):
        return t.distributions.categorical.Categorical(logits=logits).sample().item()

    @staticmethod
    def sample_top_k(logits, k):
        top_k_logits, top_k_token_ids = logits.topk(k)
        sampled_token_idx = t.distributions.categorical.Categorical(logits=top_k_logits).sample()
        return top_k_token_ids[sampled_token_idx].item()

    @staticmethod
    def sample_top_p(logits, top_p, min_tokens_to_keep=1):
        logits_sorted, indices = logits.sort(descending=True, stable=True)
        cumul_probs = logits_sorted.softmax(-1).cumsum(-1)
        n_keep = t.searchsorted(cumul_probs, top_p, side="left").item() + 1
        n_keep = max(n_keep, min_tokens_to_keep)
        keep_idx = indices[:n_keep]
        keep_logits = logits[keep_idx]
        sample = t.distributions.categorical.Categorical(logits=keep_logits).sample()
        return keep_idx[sample].item()
