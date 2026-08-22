const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField
} = require("discord.js");

const guildConfig = require("../../utils/guildConfig");

module.exports = {
    name: "setconfession",
    description: "Configure le système de confessions",

    async execute(client, message, args) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Vous devez être administrateur.");
        }

        const channel = message.mentions.channels.first();

        if (!channel) {
            return message.reply("❌ Utilisation : `+setconfession #salon`");
        }

        guildConfig.set(message.guild.id, "confessionChannel", channel.id);
        guildConfig.set(message.guild.id, "confessionEnabled", true);

        if (!guildConfig.get(message.guild.id, "blockedUsers")) {
            guildConfig.set(message.guild.id, "blockedUsers", []);
        }

        const container = new ContainerBuilder()
            .setAccentColor(0x9B59B6);

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "## 🤫 Système de Confessions"
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### ✅ Configuration terminée



Le système est maintenant prêt.

Vous pourrez ensuite utiliser les commandes :
- \`+blconfession\`
- \`+unblconfession\`
- \`+delconfession\`
- etc.`
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("confession_status")
                    .setLabel("🟢 Activé")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true),

                new ButtonBuilder()
                    .setCustomId("confession_channel")
                    .setLabel(channel.name)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            )
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `-# ${message.guild.name} • Configuration des confessions`
            )
        );

        await message.channel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [container]
        });
    }
};