def get_logprobs(logits, tokens, prefix_len=None):
    if prefix_len is not None:
        logits = logits[:, prefix_len - 1 :]
        tokens = tokens[:, prefix_len - 1 :]

    logprobs = logits.log_softmax(-1)

    correct_logprobs = eindex(logprobs, tokens, "b s [b s+1]")

    return correct_logprobs
