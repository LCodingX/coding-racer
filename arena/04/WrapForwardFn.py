grad_tracking_enabled = True


def wrap_forward_fn(numpy_func, is_differentiable=True):
    def tensor_func(*args, **kwargs):
        arg_arrays = tuple([(a.array if isinstance(a, Tensor) else a) for a in args])
        out_arr = numpy_func(*arg_arrays, **kwargs)
        requires_grad = (
            grad_tracking_enabled
            and is_differentiable
            and any([(isinstance(a, Tensor) and a.requires_grad) for a in args])
        )
        out = Tensor(out_arr, requires_grad)
        if requires_grad:
            parents = {idx: a for idx, a in enumerate(args) if isinstance(a, Tensor)}
            out.recipe = Recipe(numpy_func, arg_arrays, kwargs, parents)
        return out
    return tensor_func


class BackwardFuncLookup:
    def __init__(self):
        self.back_funcs = {}

    def add_back_func(self, forward_fn, arg_position, back_fn):
        self.back_funcs[(forward_fn, arg_position)] = back_fn

    def get_back_func(self, forward_fn, arg_position):
        return self.back_funcs[(forward_fn, arg_position)]


BACK_FUNCS = BackwardFuncLookup()


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
