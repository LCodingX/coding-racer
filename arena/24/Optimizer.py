def get_optimizer(model, base_lr, head_lr):
    return t.optim.AdamW(
        [
            {"params": model.get_base_model_trainable_params(), "lr": base_lr},
            {"params": model.get_value_head_params(), "lr": head_lr},
        ],
        maximize=True,
    )


def get_optimizer_and_scheduler(args, model):
    def lr_lambda(step):
        if step < args.warmup_steps:
            return step / args.warmup_steps
        else:
            return 1 - (1 - args.final_scale) * (step - args.warmup_steps) / (
                args.total_phases - args.warmup_steps
            )

    optimizer = get_optimizer(model, args.base_lr, args.head_lr)
    scheduler = t.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda=lr_lambda)
    return optimizer, scheduler
