class ResidualBlock(nn.Module):
    def __init__(self, in_feats, out_feats, first_stride=1):
        super().__init__()

        is_shape_preserving = (first_stride == 1) and (in_feats == out_feats)

        self.left = Sequential(
            Conv2d(in_feats, out_feats, kernel_size=3, stride=first_stride, padding=1),
            BatchNorm2d(out_feats),
            ReLU(),
            Conv2d(out_feats, out_feats, kernel_size=3, stride=1, padding=1),
            BatchNorm2d(out_feats),
        )
        self.right = (
            nn.Identity()
            if is_shape_preserving
            else Sequential(
                Conv2d(in_feats, out_feats, kernel_size=1, stride=first_stride),
                BatchNorm2d(out_feats),
            )
        )
        self.relu = ReLU()

    def forward(self, x):
        x_left = self.left(x)
        x_right = self.right(x)
        return self.relu(x_left + x_right)
