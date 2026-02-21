class LoraHooks(nn.Module):
    cache_qkv_in = None
    cache_z = None

    def __init__(self, layer_idx, cfg, lora_alpha=32, rank=4, dtype=None):
        super().__init__()
        self.layer_idx = layer_idx
        self.rank = rank
        self.lora_alpha = lora_alpha
        self.dtype = dtype

        self.n_qo_heads = n_qo_heads = cfg.n_heads
        self.n_kv_heads = n_kv_heads = (
            cfg.n_key_value_heads if cfg.n_key_value_heads is not None else cfg.n_heads
        )
        d_model, d_head = cfg.d_model, cfg.d_head

        self.lora_q = Lora(
            d_model, d_head, n_inst=n_qo_heads, rank=rank, lora_alpha=lora_alpha, dtype=dtype
        )
        self.lora_k = Lora(
            d_model, d_head, n_inst=n_kv_heads, rank=rank, lora_alpha=lora_alpha, dtype=dtype
        )
        self.lora_v = Lora(
            d_model, d_head, n_inst=n_kv_heads, rank=rank, lora_alpha=lora_alpha, dtype=dtype
        )
        self.lora_o = Lora(
            d_head, d_model, n_inst=n_qo_heads, rank=rank, lora_alpha=lora_alpha, dtype=dtype
        )

    def store_hook_attn_normalized(self, normalized, hook):
        self.cache_qkv_in = normalized

    def store_hook_z(self, z, hook):
        self.cache_z = z

    def list_fwd_hooks(self):
        fwd_hooks = []
        fwd_hooks.append(
            (f"blocks.{self.layer_idx}.ln1.hook_normalized", self.store_hook_attn_normalized)
        )
        fwd_hooks.append((f"blocks.{self.layer_idx}.attn.hook_q", self.lora_hook_qkv))
        fwd_hooks.append((f"blocks.{self.layer_idx}.attn.hook_k", self.lora_hook_qkv))
        fwd_hooks.append((f"blocks.{self.layer_idx}.attn.hook_v", self.lora_hook_qkv))
        fwd_hooks.append((f"blocks.{self.layer_idx}.attn.hook_z", self.store_hook_z))
        fwd_hooks.append((f"blocks.{self.layer_idx}.hook_attn_out", self.lora_hook_out))

        return fwd_hooks

    def lora_hook_qkv(self, qkv_hook_out, hook):
        hook_location = hook.name.split(".")[-1]

        qkv_in = self.cache_qkv_in
        qkv_in_repeated = einops.repeat(
            qkv_in, "batch pos d_model -> batch pos n_inst d_model", n_inst=1
        )

        if hook_location == "hook_q":
            return qkv_hook_out + self.lora_q(qkv_in_repeated)
        elif hook_location == "hook_k":
            return qkv_hook_out + self.lora_k(qkv_in_repeated)
        elif hook_location == "hook_v":
            return qkv_hook_out + self.lora_v(qkv_in_repeated)
        else:
            raise ValueError(f"Invalid hook location: {hook_location}")

    def lora_hook_out(self, attn_out, hook):
        lora_result = self.lora_o(self.cache_z)
        lora_attn_out = einops.einsum(lora_result, "... n_heads d_model -> ... d_model")
        return attn_out + lora_attn_out
