@t.no_grad()
def compute_advantages(values, rewards, prefix_len):
    one_step_q_est = t.cat([values[:, prefix_len:-1], rewards[:, None]], dim=-1)

    zero_step_value_est = values[:, prefix_len - 1 : -1]

    advantages = one_step_q_est - zero_step_value_est
    return advantages
