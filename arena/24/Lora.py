class Lora(nn.Module):
    def __init__(self, d_in=768, d_out=768, rank=4, lora_alpha=32, n_inst=None, dtype=None):
        super().__init__()
        self.rank = rank
        self.d_in = d_in
        self.d_out = d_out
        self.n_inst = 1 if n_inst is None else n_inst
        self.lora_alpha = lora_alpha
        self.dtype = dtype

        self.A = nn.Parameter(t.empty(self.n_inst, d_in, rank, dtype=dtype))
        self.B = nn.Parameter(t.zeros(self.n_inst, rank, d_out, dtype=dtype))

        nn.init.kaiming_uniform_(self.A, a=5**0.5)

    def forward(self, x):
        if x.dtype != self.dtype:
            x = x.to(self.dtype)
        assert (
            x.shape[-2] == self.n_inst or x.shape[-2] == 1
        )

        tmp = einops.einsum(x, self.A, "... inst d_in, inst d_in rank -> ... inst rank")
        out = einops.einsum(tmp, self.B, "... inst rank, inst rank d_out -> ... inst d_out")

        return out * self.lora_alpha / self.rank
