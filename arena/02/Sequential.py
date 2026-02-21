class Sequential(nn.Module):
    def __init__(self, *modules: nn.Module):
        super().__init__()
        for index, mod in enumerate(modules):
            self._modules[str(index)] = mod

    def __getitem__(self, index):
        index %= len(self._modules)
        return self._modules[str(index)]

    def __setitem__(self, index, module):
        index %= len(self._modules)
        self._modules[str(index)] = module

    def forward(self, x):
        for mod in self._modules.values():
            x = mod(x)
        return x
