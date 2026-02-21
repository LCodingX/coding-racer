class SimpleMLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.flatten = nn.Flatten()
        self.linear1 = nn.Linear(in_features=28 * 28, out_features=100)
        self.relu = nn.ReLU()
        self.linear2 = nn.Linear(in_features=100, out_features=10)

    def forward(self, x):
        return self.linear2(self.relu(self.linear1(self.flatten(x))))
