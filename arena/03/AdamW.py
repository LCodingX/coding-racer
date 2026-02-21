class AdamW:
    def __init__(self, params, lr=0.001, betas=(0.9, 0.999), eps=1e-08, weight_decay=0.0):
        self.params = list(params)
        self.lr = lr
        self.beta1, self.beta2 = betas
        self.eps = eps
        self.lmda = weight_decay
        self.t = 1

        self.m = [t.zeros_like(p) for p in self.params]
        self.v = [t.zeros_like(p) for p in self.params]

    def zero_grad(self):
        for p in self.params:
            p.grad = None

    @t.inference_mode()
    def step(self):
        for theta, m, v in zip(self.params, self.m, self.v):
            g = theta.grad
            theta *= 1 - self.lr * self.lmda
            m.copy_(self.beta1 * m + (1 - self.beta1) * g)
            v.copy_(self.beta2 * v + (1 - self.beta2) * g.pow(2))
            m_hat = m / (1 - self.beta1**self.t)
            v_hat = v / (1 - self.beta2**self.t)
            theta -= self.lr * m_hat / (v_hat.sqrt() + self.eps)
        self.t += 1

    def __repr__(self):
        return (
            f"AdamW(lr={self.lr}, beta1={self.beta1}, beta2={self.beta2}, eps={self.eps}, "
            f"weight_decay={self.lmda})"
        )
