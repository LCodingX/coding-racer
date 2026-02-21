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
