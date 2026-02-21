class RMSprop:
    def __init__(self, params, lr=0.01, alpha=0.99, eps=1e-08, weight_decay=0.0, momentum=0.0):
        self.params = list(params)
        self.lr = lr
        self.eps = eps
        self.mu = momentum
        self.lmda = weight_decay
        self.alpha = alpha

        self.b = [t.zeros_like(p) for p in self.params]
        self.v = [t.zeros_like(p) for p in self.params]

    def zero_grad(self):
        for p in self.params:
            p.grad = None

    @t.inference_mode()
    def step(self):
        for theta, b, v in zip(self.params, self.b, self.v):
            g = theta.grad
            if self.lmda != 0:
                g = g + self.lmda * theta
            v.copy_(self.alpha * v + (1 - self.alpha) * g.pow(2))
            g = g / (v.sqrt() + self.eps)
            if self.mu > 0:
                b.copy_(self.mu * b + g)
                g = b
            theta -= self.lr * g

    def __repr__(self):
        return (
            f"RMSprop(lr={self.lr}, eps={self.eps}, momentum={self.mu}, "
            f"weight_decay={self.lmda}, alpha={self.alpha})"
        )
