def _sum(x, dim=None, keepdim=False):
    return np.sum(x, axis=dim, keepdims=keepdim)


def _matmul2d(x, y):
    return x @ y


def _getitem(x, index):
    if isinstance(index, tuple) and all(isinstance(i, Tensor) for i in index):
        index = tuple([i.array for i in index])
    return x[index]


def _argmax(x, dim=None, keepdim=False):
    result = np.argmax(x, axis=dim)
    if keepdim:
        return np.expand_dims(result, axis=([] if dim is None else dim))
    return result


log = wrap_forward_fn(np.log)
exp = wrap_forward_fn(np.exp)
reshape = wrap_forward_fn(np.reshape)
permute = wrap_forward_fn(np.transpose)
negative = wrap_forward_fn(np.negative)
maximum = wrap_forward_fn(np.maximum)
add = wrap_forward_fn(np.add)
subtract = wrap_forward_fn(np.subtract)
multiply = wrap_forward_fn(np.multiply)
true_divide = wrap_forward_fn(np.true_divide)
eq = wrap_forward_fn(np.equal, is_differentiable=False)
sum = wrap_forward_fn(_sum)
matmul = wrap_forward_fn(_matmul2d)
getitem = wrap_forward_fn(_getitem)
argmax = wrap_forward_fn(_argmax, is_differentiable=False)


def relu(x):
    return maximum(x, 0.0)


def add_(x, other, alpha=1.0):
    np.add(x.array, other.array * alpha, out=x.array)
    return x


def sub_(x, other, alpha=1.0):
    np.subtract(x.array, other.array * alpha, out=x.array)
    return x
