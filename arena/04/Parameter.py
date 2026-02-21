class Parameter(Tensor):
    def __init__(self, tensor, requires_grad=True):
        return super().__init__(tensor.array, requires_grad=requires_grad)

    def __repr__(self):
        return f"Parameter containing:\n{super().__repr__()}"
