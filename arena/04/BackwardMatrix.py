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
