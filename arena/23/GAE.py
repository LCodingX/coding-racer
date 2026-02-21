@t.inference_mode()
def compute_advantages(next_value, next_terminated, rewards, values, terminated, gamma, gae_lambda):
    T = values.shape[0]
    terminated = terminated.float()
    next_terminated = next_terminated.float()

    next_values = t.concat([values[1:], next_value[None, :]])
    next_terminated = t.concat([terminated[1:], next_terminated[None, :]])

    deltas = rewards + gamma * next_values * (1.0 - next_terminated) - values

    advantages = t.zeros_like(deltas)
    advantages[-1] = deltas[-1]
    for s in reversed(range(T - 1)):
        advantages[s] = (
            deltas[s] + gamma * gae_lambda * (1.0 - terminated[s + 1]) * advantages[s + 1]
        )

    return advantages
