class ReplayBuffer:
    def __init__(self, num_envs, obs_shape, action_shape, buffer_size, seed):
        self.num_envs = num_envs
        self.obs_shape = obs_shape
        self.action_shape = action_shape
        self.buffer_size = buffer_size
        self.rng = np.random.default_rng(seed)

        self.obs = np.empty((0, *self.obs_shape), dtype=np.float32)
        self.actions = np.empty((0, *self.action_shape), dtype=np.int32)
        self.rewards = np.empty(0, dtype=np.float32)
        self.terminated = np.empty(0, dtype=bool)
        self.next_obs = np.empty((0, *self.obs_shape), dtype=np.float32)

    def add(self, obs, actions, rewards, terminated, next_obs):
        for data, expected_shape in zip(
            [obs, actions, rewards, terminated, next_obs],
            [self.obs_shape, self.action_shape, (), (), self.obs_shape],
        ):
            assert isinstance(data, np.ndarray)
            assert data.shape == (self.num_envs, *expected_shape)

        self.obs = np.concatenate((self.obs, obs))[-self.buffer_size :]
        self.actions = np.concatenate((self.actions, actions))[-self.buffer_size :]
        self.rewards = np.concatenate((self.rewards, rewards))[-self.buffer_size :]
        self.terminated = np.concatenate((self.terminated, terminated))[-self.buffer_size :]
        self.next_obs = np.concatenate((self.next_obs, next_obs))[-self.buffer_size :]

    def sample(self, sample_size, device):
        indices = self.rng.integers(0, self.buffer_size, sample_size)

        return ReplayBufferSamples(
            obs=t.tensor(self.obs[indices], dtype=t.float32, device=device),
            actions=t.tensor(self.actions[indices], device=device),
            rewards=t.tensor(self.rewards[indices], dtype=t.float32, device=device),
            terminated=t.tensor(self.terminated[indices], device=device),
            next_obs=t.tensor(self.next_obs[indices], dtype=t.float32, device=device),
        )
