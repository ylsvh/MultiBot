const { PermissionsBitField } = require("discord.js");
const guildConfig = require("../../utils/guildConfig");

module.exports = {

    name: "resetconfession",
    description: "Réinitialise totalement le système",

    async execute(client, message) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return message.reply("❌ Vous devez être administrateur.");

        guildConfig.set(message.guild.id, "confessionChannel", null);
        guildConfig.set(message.guild.id, "confessionEnabled", false);
        guildConfig.set(message.guild.id, "blockedUsers", []);
        guildConfig.set(message.guild.id, "confessions", []);

        message.reply("✅ Toutes les données des confessions ont été réinitialisées.");
    }
};