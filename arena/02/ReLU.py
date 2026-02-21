class ReLU(nn.Module):
    def forward(self, x):
        return t.maximum(x, t.tensor(0.0))
