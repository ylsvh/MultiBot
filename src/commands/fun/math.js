module.exports = {
    name: "math",

    async execute(message, args) {
        await message.channel.sendTyping();
        if (!message || !message.channel) return;

        const expression = args.join("").trim();
        if (!expression) return message.channel.send("Usage : +math 2+2");

        if (!/^[0-9+\-*/().]+$/.test(expression)) {
            return message.channel.send("Expression invalide");
        }

        let result;
        try {
            result = Function(`"use strict"; return (${expression})`)();
        } catch {
            return message.channel.send("Calcul invalide");
        }

        message.channel.send(`Résultat : ${result}`);
    }
};
