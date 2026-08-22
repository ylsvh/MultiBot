const guildconfig = require('../../utils/guildConfig');

module.exports = {
    name: "dellevel",
    description: "Retirer des niveaux à un membre",
    usage: "+dellevel <@membre> <niveaux>",

    async execute(client, message, args) {
        const user = message.mentions.users.first();

        if (!user) {
            return message.reply("❗ Tu dois mentionner un utilisateur.");
        }

        const levels = parseInt(args[1]);

        if (isNaN(levels) || levels <= 0) {
            return message.reply("❗ Tu dois spécifier un nombre valide de niveaux à retirer.");
        }

        if (message.author.id !== guildconfig.getAll(message.guild.id).botOwners[0]) {
            return message.reply("❗ Tu n'as pas la permission d'utiliser cette commande.");
        }

        const guildData = guildconfig.getAll(message.guild.id);

        if (!guildData.levels || !guildData.levels[user.id]) {
            return message.reply("❗ Cet utilisateur n'a aucun niveau enregistré.");
        }

        guildData.levels[user.id].level = Math.max(
            0,
            guildData.levels[user.id].level - levels
        );

        return message.reply(
            `✅ ${levels} niveau(x) retiré(s) à ${user.tag}. Niveau actuel : ${guildData.levels[user.id].level}.`
        );
    }
};