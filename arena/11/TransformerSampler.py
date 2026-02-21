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
