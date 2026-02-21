def normalize_reward(reward, eps=1e-5):
    return (reward - reward.mean()) / (reward.std() + eps)


def calc_entropy_bonus(logits, ent_coef, gen_len):
    assert logits.shape[1] == gen_len

    logprobs = logits.log_softmax(dim=-1)
    probs = logprobs.exp()
    entropy = -(probs * logprobs).sum(dim=-1)
    return ent_coef * entropy.mean()


def calc_value_function_loss(values, mb_returns, vf_coef, gen_len):
    assert values.shape[1] == gen_len
    assert mb_returns.shape[1] == gen_len

    return 0.5 * vf_coef * (values - mb_returns).pow(2).mean()


def calc_clipped_surrogate_objective(
    logprobs,
    mb_logprobs,
    mb_advantages,
    clip_coef,
    gen_len,
    eps=1e-8,
):
    assert logprobs.shape[1] == mb_logprobs.shape[1] == mb_advantages.shape[1] == gen_len

    logits_diff = logprobs - mb_logprobs

    r_theta = t.exp(logits_diff)

    mb_advantages = normalize_reward(mb_advantages, eps)

    non_clipped = r_theta * mb_advantages
    clipped = t.clip(r_theta, 1 - clip_coef, 1 + clip_coef) * mb_advantages

    return t.minimum(non_clipped, clipped).mean()
