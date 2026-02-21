class ResNet34(nn.Module):
    def __init__(
        self,
        n_blocks_per_group=[3, 4, 6, 3],
        out_features_per_group=[64, 128, 256, 512],
        first_strides_per_group=[1, 2, 2, 2],
        n_classes=1000,
    ):
        super().__init__()

        out_feats0 = 64
        self.n_blocks_per_group = n_blocks_per_group
        self.out_features_per_group = out_features_per_group
        self.first_strides_per_group = first_strides_per_group
        self.n_classes = n_classes

        self.in_layers = Sequential(
            Conv2d(3, out_feats0, kernel_size=7, stride=2, padding=3),
            BatchNorm2d(out_feats0),
            ReLU(),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1),
        )

        residual_layers = []
        for i in range(len(n_blocks_per_group)):
            residual_layers.append(
                BlockGroup(
                    n_blocks=n_blocks_per_group[i],
                    in_feats=[64, *self.out_features_per_group][i],
                    out_feats=self.out_features_per_group[i],
                    first_stride=self.first_strides_per_group[i],
                )
            )
        self.residual_layers = Sequential(*residual_layers)

        self.out_layers = Sequential(
            AveragePool(),
            Linear(out_features_per_group[-1], n_classes),
        )

    def forward(self, x):
        post_first_conv_block = self.in_layers(x)
        post_block_groups = self.residual_layers(post_first_conv_block)
        logits = self.out_layers(post_block_groups)
        return logits
