class TransformerWithValueHeadLora(HookedTransformerWithValueHead):
    def base_model_params(self):
        return (
            p
            for name, p in self.named_parameters()
            if "value_head" not in name and "lora" not in name
        )

    def lora_params(self):
        return self.lora.parameters()

    def get_base_model_trainable_params(self):
        return self.lora_params()

    def get_value_head_params(self):
        return (p for name, p in self.named_parameters() if "value_head" in name)

    @classmethod
    def from_pretrained(cls, *args, lora_alpha=32, rank=4, **kwargs):
        model = super(TransformerWithValueHeadLora, cls).from_pretrained(*args, **kwargs)
        model.setup_lora(lora_alpha=lora_alpha, rank=rank, **kwargs)

        for param in model.base_model_params():
            param.requires_grad = False

        return model

    def setup_lora(self, lora_alpha=32, rank=4, **kwargs):
        self.lora = nn.ModuleList(
            [
                LoraHooks(layer_idx, self.cfg, lora_alpha, rank)
                for layer_idx in range(len(self.blocks))
            ]
        ).to(device)

        self.lora_fwd_hooks = []
        for layer_idx in range(len(self.blocks)):
            self.lora_fwd_hooks.extend(self.lora[layer_idx].list_fwd_hooks())

    @property
    def fwd_hooks(self):
        return self.lora_fwd_hooks + [self.value_head_hook]

    def forward_with_value_head(self, tokens):
        with self.hooks(fwd_hooks=self.fwd_hooks):
            logits = self.forward(tokens)
        value = self.value_head_output
        return logits, value

    @t.no_grad()
    def generate(self, tokens, **kwargs):
        with self.hooks(fwd_hooks=self.lora_fwd_hooks):
            gen_tokens = super().generate(tokens, **kwargs)
        return gen_tokens
