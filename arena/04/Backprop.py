def topological_sort(node, get_children):
    result = []
    perm = set()
    temp = set()

    def visit(cur):
        if cur in perm:
            return
        if cur in temp:
            raise ValueError("Not a DAG!")
        temp.add(cur)
        for next in get_children(cur):
            visit(next)
        result.append(cur)
        perm.add(cur)
        temp.remove(cur)

    visit(node)
    return result


def sorted_computational_graph(tensor):
    def get_parents(tensor):
        if tensor.recipe is None:
            return []
        return list(tensor.recipe.parents.values())
    return topological_sort(tensor, get_parents)[::-1]


def backprop(end_node, end_grad=None):
    end_grad_arr = np.ones_like(end_node.array) if end_grad is None else end_grad.array
    grads = {end_node: end_grad_arr}

    for node in sorted_computational_graph(end_node):
        outgrad = grads.pop(node)
        if node.is_leaf:
            if node.requires_grad:
                node.grad = Tensor(outgrad) if node.grad is None else node.grad + outgrad
        else:
            for argnum, parent in node.recipe.parents.items():
                back_fn = BACK_FUNCS.get_back_func(node.recipe.func, argnum)
                in_grad = back_fn(outgrad, node.array, *node.recipe.args, **node.recipe.kwargs)
                grads[parent] = in_grad if (parent not in grads) else grads[parent] + in_grad
