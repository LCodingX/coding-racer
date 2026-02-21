def get_actor_and_critic_mujoco(num_obs, num_actions):
    class Critic(nn.Module):
        def __init__(self, num_obs):
            super().__init__()
            self.critic = nn.Sequential(
                layer_init(nn.Linear(num_obs, 64)),
                nn.Tanh(),
                layer_init(nn.Linear(64, 64)),
                nn.Tanh(),
                layer_init(nn.Linear(64, 1), std=1.0),
            )

        def forward(self, obs):
            return self.critic(obs)

    class Actor(nn.Module):
        def __init__(self, num_obs, num_actions):
            super().__init__()
            self.actor_mu = nn.Sequential(
                layer_init(nn.Linear(num_obs, 64)),
                nn.Tanh(),
                layer_init(nn.Linear(64, 64)),
                nn.Tanh(),
                layer_init(nn.Linear(64, num_actions), std=0.01),
            )
            self.actor_log_sigma = nn.Parameter(t.zeros(1, num_actions))

        def forward(self, obs):
            mu = self.actor_mu(obs)
            sigma = t.exp(self.actor_log_sigma).broadcast_to(mu.shape)
            dist = t.distributions.Normal(mu, sigma)
            return mu, sigma, dist

    return Actor(num_obs, num_actions), Critic(num_obs)
