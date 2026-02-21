class Generator(nn.Module):
    def __init__(
        self,
        latent_dim_size=100,
        img_size=64,
        img_channels=3,
        hidden_channels=[128, 256, 512],
    ):
        n_layers = len(hidden_channels)
        assert img_size % (2**n_layers) == 0, "activation size must double at each layer"

        super().__init__()

        hidden_channels = hidden_channels[::-1]

        self.latent_dim_size = latent_dim_size
        self.img_size = img_size
        self.img_channels = img_channels
        self.hidden_channels = hidden_channels

        first_height = img_size // (2**n_layers)
        first_size = hidden_channels[0] * (first_height**2)
        self.project_and_reshape = nn.Sequential(
            nn.Linear(latent_dim_size, first_size, bias=False),
            Rearrange("b (ic h w) -> b ic h w", h=first_height, w=first_height),
            nn.BatchNorm2d(hidden_channels[0]),
            nn.ReLU(),
        )

        in_channels = hidden_channels
        out_channels = hidden_channels[1:] + [img_channels]

        conv_layer_list = []
        for i, (c_in, c_out) in enumerate(zip(in_channels, out_channels)):
            conv_layer = [
                nn.ConvTranspose2d(c_in, c_out, 4, 2, 1),
                nn.ReLU() if i < n_layers - 1 else Tanh(),
            ]
            if i < n_layers - 1:
                conv_layer.insert(1, nn.BatchNorm2d(c_out))
            conv_layer_list.append(nn.Sequential(*conv_layer))

        self.hidden_layers = nn.Sequential(*conv_layer_list)

    def forward(self, x):
        x = self.project_and_reshape(x)
        x = self.hidden_layers(x)
        return x
