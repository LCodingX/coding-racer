def conv2d_minimal(x, weights):
    batch, in_channels, height, width = x.shape
    out_channels, in_channels_w, kernel_height, kernel_width = weights.shape
    assert in_channels == in_channels_w

    out_height = height - kernel_height + 1
    out_width = width - kernel_width + 1

    x_unfolded = x.unfold(2, kernel_height, 1).unfold(3, kernel_width, 1)
    return einops.einsum(
        x_unfolded, weights,
        "b ic oh ow kh kw, oc ic kh kw -> b oc oh ow"
    )
