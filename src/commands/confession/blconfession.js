const { PermissionsBitField } = require("discord.js");
const guildConfig = require("../../utils/guildConfig");

module.exports = {

    name: "blconfession",
    description: "Bloque un utilisateur",

    async execute(client, message) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return message.reply("❌ Vous devez être administrateur.");

        const user = message.mentions.users.first();

        if (!user)
            return message.reply("❌ Mentionnez un utilisateur.");

        const blocked =
            guildConfig.get(message.guild.id, "blockedUsers") || [];

        if (blocked.includes(user.id))
            return message.reply("⚠️ Cet utilisateur est déjà bloqué.");

        blocked.push(user.id);

        guildConfig.set(
            message.guild.id,
            "blockedUsers",
            blocked
        );

        message.reply(`🚫 ${user.tag} est maintenant bloqué.`);
    }
};