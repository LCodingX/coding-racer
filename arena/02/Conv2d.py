class Conv2d(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size, stride=1, padding=0):
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.kernel_size = kernel_size
        self.stride = stride
        self.padding = padding

        kernel_height = kernel_width = kernel_size
        sf = 1 / np.sqrt(in_channels * kernel_width * kernel_height)
        self.weight = nn.Parameter(
            sf * (2 * t.rand(out_channels, in_channels, kernel_height, kernel_width) - 1)
        )

    def forward(self, x):
        return t.nn.functional.conv2d(x, self.weight, stride=self.stride, padding=self.padding)

    def extra_repr(self):
        keys = ["in_channels", "out_channels", "kernel_size", "stride", "padding"]
        return ", ".join([f"{key}={getattr(self, key)}" for key in keys])
