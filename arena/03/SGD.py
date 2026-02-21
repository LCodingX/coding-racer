class SGD:
    def __init__(self, params, lr, momentum=0.0, weight_decay=0.0):
        self.params = list(params)
        self.lr = lr
        self.mu = momentum
        self.lmda = weight_decay

        self.b = [t.zeros_like(p) for p in self.params]

    def zero_grad(self):
        for param in self.params:
            param.grad = None

    @t.inference_mode()
    def step(self):
        for b, theta in zip(self.b, self.params):
            g = theta.grad
            if self.lmda != 0:
                g = g + self.lmda * theta
            if self.mu != 0:
                b.copy_(self.mu * b + g)
                g = b
            theta -= self.lr * g

    def __repr__(self):
        return f"SGD(lr={self.lr}, momentum={self.mu}, weight_decay={self.lmda})"
