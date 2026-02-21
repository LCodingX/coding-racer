def pad2d(x, left, right, top, bottom, pad_value):
    return t.nn.functional.pad(x, (left, right, top, bottom), value=pad_value)
