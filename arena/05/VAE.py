class VAE(nn.Module):
    def __init__(self, latent_dim_size, hidden_dim_size):
        super().__init__()
        self.latent_dim_size = latent_dim_size
        self.hidden_dim_size = hidden_dim_size
        self.encoder = nn.Sequential(
            nn.Conv2d(1, 16, 4, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(16, 32, 4, stride=2, padding=1),
            nn.ReLU(),
            Rearrange("b c h w -> b (c h w)"),
            nn.Linear(7 * 7 * 32, hidden_dim_size),
            nn.ReLU(),
            nn.Linear(hidden_dim_size, latent_dim_size * 2),
            Rearrange("b (n latent_dim) -> n b latent_dim", n=2),
        )
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim_size, hidden_dim_size),
            nn.ReLU(),
            nn.Linear(hidden_dim_size, 7 * 7 * 32),
            nn.ReLU(),
            Rearrange("b (c h w) -> b c h w", c=32, h=7, w=7),
            nn.ConvTranspose2d(32, 16, 4, stride=2, padding=1),
            nn.ReLU(),
            nn.ConvTranspose2d(16, 1, 4, stride=2, padding=1),
        )

    def sample_latent_vector(self, x):
        mu, logsigma = self.encoder(x)
        sigma = t.exp(logsigma)
        z = mu + sigma * t.randn_like(sigma)
        return z, mu, logsigma

    def forward(self, x):
        z, mu, logsigma = self.sample_latent_vector(x)
        x_prime = self.decoder(z)
        return x_prime, mu, logsigma
