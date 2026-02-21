class Sigmoid(nn.Module):
    def forward(self, x):
        return 1 / (1 + t.exp(-x))
