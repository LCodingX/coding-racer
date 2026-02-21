def calc_clipped_surrogate_objective(
    dist,
    mb_action,
    mb_advantages,
    mb_logprobs,
    clip_coef,
    eps=1e-8,
):
    assert mb_action.shape == mb_advantages.shape == mb_logprobs.shape
    logits_diff = dist.log_prob(mb_action) - mb_logprobs

    prob_ratio = t.exp(logits_diff)

    mb_advantages = (mb_advantages - mb_advantages.mean()) / (mb_advantages.std() + eps)

    non_clipped = prob_ratio * mb_advantages
    clipped = t.clip(prob_ratio, 1 - clip_coef, 1 + clip_coef) * mb_advantages

    return t.minimum(non_clipped, clipped).mean()


def calc_value_function_loss(values, mb_returns, vf_coef):
    assert values.shape == mb_returns.shape
    return vf_coef * (values - mb_returns).pow(2).mean()


def calc_entropy_bonus(dist, ent_coef):
    return ent_coef * dist.entropy().mean()
