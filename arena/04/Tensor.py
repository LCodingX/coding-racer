Arr = np.ndarray


class Tensor:
    def __init__(self, array, requires_grad=False):
        self.array = array if isinstance(array, Arr) else np.array(array)
        if self.array.dtype == np.float64:
            self.array = self.array.astype(np.float32)
        self.requires_grad = requires_grad
        self.grad = None
        self.recipe = None

    def __neg__(self):
        return negative(self)

    def __add__(self, other):
        return add(self, other)

    def __radd__(self, other):
        return add(other, self)

    def __sub__(self, other):
        return subtract(self, other)

    def __rsub__(self, other):
        return subtract(other, self)

    def __mul__(self, other):
        return multiply(self, other)

    def __rmul__(self, other):
        return multiply(other, self)

    def __truediv__(self, other):
        return true_divide(self, other)

    def __rtruediv__(self, other):
        return true_divide(other, self)

    def __matmul__(self, other):
        return matmul(self, other)

    def __rmatmul__(self, other):
        return matmul(other, self)

    def __eq__(self, other):
        return eq(self, other)

    def __repr__(self):
        return f"Tensor({repr(self.array)}, requires_grad={self.requires_grad})"

    def __len__(self):
        if self.array.ndim == 0:
            raise TypeError
        return self.array.shape[0]

    def __hash__(self):
        return id(self)

    def __getitem__(self, index):
        return getitem(self, index)

    def add_(self, other, alpha=1.0):
        add_(self, other, alpha=alpha)
        return self

    def sub_(self, other, alpha=1.0):
        sub_(self, other, alpha=alpha)
        return self

    def __iadd__(self, other):
        self.add_(other)
        return self

    def __isub__(self, other):
        self.sub_(other)
        return self

    @property
    def T(self):
        return permute(self, axes=(-1, -2))

    def item(self):
        return self.array.item()

    def sum(self, dim=None, keepdim=False):
        return sum(self, dim=dim, keepdim=keepdim)

    def log(self):
        return log(self)

    def exp(self):
        return exp(self)

    def reshape(self, new_shape):
        return reshape(self, new_shape)

    def permute(self, dims):
        return permute(self, dims)

    def maximum(self, other):
        return maximum(self, other)

    def relu(self):
        return relu(self)

    def argmax(self, dim=None, keepdim=False):
        return argmax(self, dim=dim, keepdim=keepdim)

    def uniform_(self, low, high):
        self.array[:] = np.random.uniform(low, high, self.array.shape)
        return self

    def backward(self, end_grad=None):
        if isinstance(end_grad, Arr):
            end_grad = Tensor(end_grad)
        return backprop(self, end_grad)

    def size(self, dim=None):
        if dim is None:
            return self.shape
        return self.shape[dim]

    @property
    def shape(self):
        return self.array.shape

    @property
    def ndim(self):
        return self.array.ndim

    @property
    def is_leaf(self):
        if self.requires_grad and self.recipe and self.recipe.parents:
            return False
        return True

    def __bool__(self):
        if np.array(self.shape).prod() != 1:
            raise RuntimeError("bool value of Tensor with more than one value is ambiguous")
        return bool(self.item())


def empty(*shape):
    return Tensor(np.empty(shape))


def zeros(*shape):
    return Tensor(np.zeros(shape))


def arange(start, end, step=1):
    return Tensor(np.arange(start, end, step=step))


def tensor(array, requires_grad=False):
    return Tensor(array, requires_grad=requires_grad)
