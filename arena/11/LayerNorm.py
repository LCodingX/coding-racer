class LayerNorm(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        self.cfg = cfg
        self.w = nn.Parameter(t.ones(cfg.d_model))
        self.b = nn.Parameter(t.zeros(cfg.d_model))

    def forward(self, residual):
        residual_mean = residual.mean(dim=-1, keepdim=True)
        residual_std = (
            residual.var(dim=-1, keepdim=True, unbiased=False) + self.cfg.layer_norm_eps
        ).sqrt()
        residual = (residual - residual_mean) / residual_std
        return residual * self.w + self.b
