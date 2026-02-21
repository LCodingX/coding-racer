def log_back(grad_out, out, x):
    return grad_out / x


def unbroadcast(broadcasted, original):
    n_dims_to_sum = len(broadcasted.shape) - len(original.shape)
    broadcasted = broadcasted.sum(axis=tuple(range(n_dims_to_sum)))

    dims_to_sum = tuple(
        [i for i, (o, b) in enumerate(zip(original.shape, broadcasted.shape)) if o == 1 and b > 1]
    )
    broadcasted = broadcasted.sum(axis=dims_to_sum, keepdims=True)

    assert broadcasted.shape == original.shape
    return broadcasted


def multiply_back0(grad_out, out, x, y):
    if not isinstance(y, Arr):
        y = np.array(y)
    return unbroadcast(y * grad_out, x)


def multiply_back1(grad_out, out, x, y):
    if not isinstance(x, Arr):
        x = np.array(x)
    return unbroadcast(x * grad_out, y)


def negative_back(grad_out, out, x):
    return -grad_out


def exp_back(grad_out, out, x):
    return out * grad_out


def reshape_back(grad_out, out, x, new_shape):
    return np.reshape(grad_out, x.shape)


def permute_back(grad_out, out, x, axes):
    return np.transpose(grad_out, np.argsort(axes))


def sum_back(grad_out, out, x, dim=None, keepdim=False):
    if (not keepdim) and (dim is not None):
        grad_out = np.expand_dims(grad_out, dim)
    return np.broadcast_to(grad_out, x.shape)


def maximum_back0(grad_out, out, x, y):
    bool_sum = (x > y) + 0.5 * (x == y)
    return unbroadcast(grad_out * bool_sum, x)


def maximum_back1(grad_out, out, x, y):
    bool_sum = (x < y) + 0.5 * (x == y)
    return unbroadcast(grad_out * bool_sum, y)


def matmul2d_back0(grad_out, out, x, y):
    return grad_out @ y.T


def matmul2d_back1(grad_out, out, x, y):
    return x.T @ grad_out
