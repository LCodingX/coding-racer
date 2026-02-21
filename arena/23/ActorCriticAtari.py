def get_actor_and_critic_atari(obs_shape, num_actions):
    assert obs_shape[-1] % 8 == 4

    L_after_convolutions = (obs_shape[-1] // 8) - 3
    in_features = 64 * L_after_convolutions * L_after_convolutions

    hidden = nn.Sequential(
        layer_init(nn.Conv2d(4, 32, 8, stride=4, padding=0)),
        nn.ReLU(),
        layer_init(nn.Conv2d(32, 64, 4, stride=2, padding=0)),
        nn.ReLU(),
        layer_init(nn.Conv2d(64, 64, 3, stride=1, padding=0)),
        nn.ReLU(),
        nn.Flatten(),
        layer_init(nn.Linear(in_features, 512)),
        nn.ReLU(),
    )

    actor = nn.Sequential(hidden, layer_init(nn.Linear(512, num_actions), std=0.01))
    critic = nn.Sequential(hidden, layer_init(nn.Linear(512, 1), std=1))

    return actor, critic
