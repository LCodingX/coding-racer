def train(args, model, trainloader, testloader):
    optimizer = t.optim.Adam(model.parameters(), lr=args.learning_rate)

    loss_list = []
    accuracy_list = []

    for epoch in range(args.epochs):
        for imgs, labels in trainloader:
            imgs, labels = imgs.to(device), labels.to(device)
            logits = model(imgs)

            loss = F.cross_entropy(logits, labels)
            loss.backward()
            optimizer.step()
            optimizer.zero_grad()

            loss_list.append(loss.item())

        num_correct_classifications = 0
        for imgs, labels in testloader:
            imgs, labels = imgs.to(device), labels.to(device)
            with t.inference_mode():
                logits = model(imgs)

            predictions = t.argmax(logits, dim=1)
            num_correct_classifications += (predictions == labels).sum().item()

        accuracy = num_correct_classifications / len(testloader.dataset)
        accuracy_list.append(accuracy)

    return loss_list, accuracy_list
