const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'nick',
    description: 'Change le pseudo d’un membre',

    async execute(client, message, args) {

        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
            return message.reply("❌ Tu n'as pas la permission de changer les pseudos.");
        }

        const member = message.mentions.members.first();
        if (!member) return message.reply("❌ Mentionne un membre.");

        const newNick = args.slice(1).join(" ");
        if (!newNick) return message.reply("❌ Fournis un nouveau pseudo.");

        if (!member.manageable) {
            return message.reply("❌ Je ne peux pas changer le pseudo de ce membre (rôle trop haut ou permission manquante).");
        }

        try {
            await member.setNickname(newNick, `Modifié par ${message.author.tag}`);
            message.channel.send(`✅ Le pseudo de ${member.user.tag} a été changé en **${newNick}**`);
        } catch (err) {
            message.reply("❌ Impossible de changer le pseudo.");
        }
    }
};
