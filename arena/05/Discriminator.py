class Discriminator(nn.Module):
    def __init__(self, img_size=64, img_channels=3, hidden_channels=[128, 256, 512]):
        n_layers = len(hidden_channels)
        assert img_size % (2**n_layers) == 0, "activation size must double at each layer"

        super().__init__()

        self.img_size = img_size
        self.img_channels = img_channels
        self.hidden_channels = hidden_channels

        in_channels = [img_channels] + hidden_channels[:-1]
        out_channels = hidden_channels

        conv_layer_list = []
        for i, (c_in, c_out) in enumerate(zip(in_channels, out_channels)):
            conv_layer = [
                nn.Conv2d(c_in, c_out, 4, 2, 1),
                LeakyReLU(0.2),
            ]
            if i > 0:
                conv_layer.insert(1, nn.BatchNorm2d(c_out))
            conv_layer_list.append(nn.Sequential(*conv_layer))

        self.hidden_layers = nn.Sequential(*conv_layer_list)

        final_height = img_size // (2**n_layers)
        final_size = hidden_channels[-1] * (final_height**2)
        self.classifier = nn.Sequential(
            Rearrange("b c h w -> b (c h w)"),
            nn.Linear(final_size, 1, bias=False),
            Sigmoid(),
        )

    def forward(self, x):
        x = self.hidden_layers(x)
        x = self.classifier(x)
        return x.squeeze()
