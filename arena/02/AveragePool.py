class AveragePool(nn.Module):
    def forward(self, x):
        return t.mean(x, dim=(2, 3))
