class Tanh(nn.Module):
    def forward(self, x):
        return (t.exp(x) - t.exp(-x)) / (t.exp(x) + t.exp(-x))
