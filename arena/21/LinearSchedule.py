def linear_schedule(current_step, start_e, end_e, exploration_fraction, total_timesteps):
    return start_e + (end_e - start_e) * min(
        current_step / (exploration_fraction * total_timesteps), 1
    )
