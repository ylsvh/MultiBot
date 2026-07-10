const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    PermissionsBitField
} = require("discord.js");

const guildConfig = require("../../utils/guildConfig");

module.exports = {

    name: "confessionconfig",
    description: "Affiche la configuration",

    async execute(client, message) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return message.reply("❌ Vous devez être administrateur.");

        const channel =
            guildConfig.get(message.guild.id, "confessionChannel");

        const enabled =
            guildConfig.get(message.guild.id, "confessionEnabled");

        const blocked =
            guildConfig.get(message.guild.id, "blockedUsers") || [];

        const container = new ContainerBuilder()
            .setAccentColor(0x9B59B6);

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "## 🤫 Configuration des confessions"
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**Statut :** ${enabled ? "🟢 Activé" : "🔴 Désactivé"}

**Salon :**
${channel ? `<#${channel}>` : "*Aucun*"}

**Utilisateurs bloqués :**
${blocked.length}`
            )
        );

        await message.channel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [container]
        });

    }
};