class TransformerWithLora(TransformerWithValueHeadLora):
    def get_value_head_params(self):
        return iter([])

    @classmethod
    def from_pretrained(cls, *args, lora_alpha=32, rank=4, **kwargs):
        model = super(TransformerWithLora, cls).from_pretrained(
            *args, use_value_head=False, **kwargs
        )
        model.value_head_output = None
        return model

    @property
    def fwd_hooks(self):
        return self.lora_fwd_hooks

    def forward_with_value_head(self, tokens):
        logits, value = super().forward_with_value_head(tokens)
        assert value is None
        return logits
