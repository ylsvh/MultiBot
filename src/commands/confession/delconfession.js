const { PermissionsBitField } = require("discord.js");
const guildConfig = require("../../utils/guildConfig");

module.exports = {
    name: "delconfession",
    description: "Supprime la configuration des confessions",

    async execute(client, message) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return message.reply("❌ Vous devez être administrateur.");

        guildConfig.set(message.guild.id, "confessionChannel", null);
        guildConfig.set(message.guild.id, "confessionEnabled", false);
        guildConfig.set(message.guild.id, "blockedUsers", []);

        message.reply("✅ Le système de confession a été supprimé.");
    }
};