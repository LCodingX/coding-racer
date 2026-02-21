def cross_entropy(logits, true_labels):
    batch_size = logits.shape[0]
    logprobs = logits - logits.exp().sum(-1, keepdim=True).log()
    indices = list(range(batch_size))
    return -logprobs[indices, true_labels]
