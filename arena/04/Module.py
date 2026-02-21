class Module:
    def __init__(self):
        self._modules = {}
        self._parameters = {}

    def modules(self):
        yield from self._modules.values()

    def parameters(self, recurse=True):
        yield from self._parameters.values()
        if recurse:
            for mod in self.modules():
                yield from mod.parameters(recurse=True)

    def __setattr__(self, key, val):
        if isinstance(val, Parameter):
            self._parameters[key] = val
        elif isinstance(val, Module):
            self._modules[key] = val
        super().__setattr__(key, val)

    def __call__(self, *args, **kwargs):
        return self.forward(*args, **kwargs)

    def forward(self):
        raise NotImplementedError("Subclasses must implement forward!")
