const config = require("../../../config.js");
const guildconfig = require('../../utils/guildConfig');

module.exports = {
    name: "addlevel",
    description: "Ajouter des niveaux à un membre",
    usage: "+addlevel <@membre> <niveaux>",

    async execute(client, message, args) {
        const user = message.mentions.users.first();

        if (!user) {
            return message.reply("❗ Tu dois mentionner un utilisateur.");
        }

        const levels = parseInt(args[1]);

        if (isNaN(levels) || levels <= 0) {
            return message.reply("❗ Tu dois spécifier un nombre valide de niveaux à ajouter.");
        }

        if (message.author.id === user.id) {
            return message.reply("❗ Tu ne peux pas t'ajouter des niveaux à toi-même.");
        }

        if (message.author.id !== guildconfig.getAll(message.guild.id).botOwners[0]) {
            return message.reply("❗ Tu n'as pas la permission d'utiliser cette commande.");
        }

        const guildData = guildconfig.getAll(message.guild.id);

        if (!guildData.levels) guildData.levels = {};

        if (!guildData.levels[user.id]) {
            guildData.levels[user.id] = {
                level: 0,
                xp: 0
            };
        }

        guildData.levels[user.id].level += levels;

        return message.reply(
            `✅ ${levels} niveau(x) ajouté(s) à ${user.tag}. Niveau actuel : ${guildData.levels[user.id].level}.`
        );
    }
};