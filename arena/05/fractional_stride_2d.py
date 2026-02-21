def fractional_stride_2d(x, stride_h, stride_w):
    batch, in_channels, height, width = x.shape
    width_new = width + (stride_w - 1) * (width - 1)
    height_new = height + (stride_h - 1) * (height - 1)
    x_new_shape = (batch, in_channels, height_new, width_new)

    x_new = t.zeros(size=x_new_shape, dtype=x.dtype, device=x.device)
    x_new[..., ::stride_h, ::stride_w] = x

    return x_new
