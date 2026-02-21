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
