class BlockGroup(nn.Module):
    def __init__(self, n_blocks, in_feats, out_feats, first_stride=1):
        super().__init__()
        self.blocks = Sequential(
            ResidualBlock(in_feats, out_feats, first_stride),
            *[ResidualBlock(out_feats, out_feats) for _ in range(n_blocks - 1)],
        )

    def forward(self, x):
        return self.blocks(x)
