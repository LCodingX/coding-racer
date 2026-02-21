def calc_kl_penalty(logits, ref_logits, kl_coef, gen_len):
    assert (
        logits.shape[1] == ref_logits.shape[1] == gen_len
    )

    ref_logprobs = ref_logits.log_softmax(-1)
    logprobs = logits.log_softmax(-1)
    probs = logprobs.exp()

    kl_div = (probs * (logprobs - ref_logprobs)).sum(-1)

    return kl_coef * kl_div.mean()
