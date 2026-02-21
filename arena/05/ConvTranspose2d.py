def force_pair(v):
    if isinstance(v, tuple):
        if len(v) != 2:
            raise ValueError(v)
        return (int(v[0]), int(v[1]))
    elif isinstance(v, int):
        return (v, v)
    raise ValueError(v)


def conv_transpose2d(x, weights, stride=1, padding=0):
    stride_h, stride_w = force_pair(stride)
    padding_h, padding_w = force_pair(padding)

    batch, ic, height, width = x.shape
    ic_2, oc, kernel_height, kernel_width = weights.shape
    assert ic == ic_2

    x_spaced_out = fractional_stride_2d(x, stride_h, stride_w)

    pad_h_actual = kernel_height - 1 - padding_h
    pad_w_actual = kernel_width - 1 - padding_w
    assert min(pad_h_actual, pad_w_actual) >= 0
    x_mod = pad2d(
        x_spaced_out,
        left=pad_w_actual, right=pad_w_actual,
        top=pad_h_actual, bottom=pad_h_actual,
        pad_value=0,
    )

    weights_mod = einops.rearrange(weights.flip(-1, -2), "i o h w -> o i h w")

    return conv2d_minimal(x_mod, weights_mod)


class ConvTranspose2d(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size, stride=1, padding=0):
        super().__init__()

        self.in_channels = in_channels
        self.out_channels = out_channels
        self.kernel_size = force_pair(kernel_size)
        self.stride = stride
        self.padding = padding

        sf = 1 / (self.out_channels * self.kernel_size[0] * self.kernel_size[1]) ** 0.5
        self.weight = nn.Parameter(
            sf * (2 * t.rand(in_channels, out_channels, *self.kernel_size) - 1)
        )

    def forward(self, x):
        return conv_transpose2d(x, self.weight, self.stride, self.padding)
