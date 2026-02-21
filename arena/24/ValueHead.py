class HookedTransformerWithValueHead(HookedTransformer):
    @classmethod
    def from_pretrained(cls, *args, use_value_head=True, **kwargs):
        model = super(HookedTransformerWithValueHead, cls).from_pretrained(*args, **kwargs)
        model.value_head_hook = ("ln_final.hook_normalized", model.run_value_head)

        if use_value_head:
            model.value_head = nn.Sequential(
                nn.Linear(model.cfg.d_model, 4 * model.cfg.d_model),
                nn.ReLU(),
                nn.Linear(4 * model.cfg.d_model, 1),
            )
        else:
            model.value_head = None
        return model

    @property
    def fwd_hooks(self):
        return [self.value_head_hook]

    def get_base_model_trainable_params(self):
        return (p for name, p in self.named_parameters() if "value_head" not in name)

    def get_value_head_params(self):
        return self.value_head.parameters()

    def run_value_head(self, resid_post, hook):
        self.value_head_output = self.value_head(resid_post).squeeze(-1)

    def forward_with_value_head(self, input_ids, **kwargs):
        self.value_head_output = None

        logits = self.run_with_hooks(
            input_ids,
            return_type="logits",
            fwd_hooks=self.fwd_hooks,
        )

        return logits, self.value_head_output
