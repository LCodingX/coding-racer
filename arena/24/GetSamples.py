@t.no_grad()
def get_samples(
    model,
    prompt,
    batch_size,
    gen_len=15,
    temperature=0.8,
    top_k=15,
    prepend_bos=True,
    **kwargs,
):
    input_ids = model.to_tokens(prompt, prepend_bos=prepend_bos)
    input_ids = einops.repeat(input_ids, "1 seq -> batch seq", batch=batch_size)

    output_ids = model.generate(
        input_ids,
        max_new_tokens=gen_len,
        stop_at_eos=False,
        temperature=temperature,
        top_k=top_k,
        **kwargs,
    )
    samples = model.to_string(output_ids)

    return output_ids.clone(), samples
