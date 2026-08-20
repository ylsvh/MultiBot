const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
} = require("discord.js");

const guildConfig = require("../../utils/guildConfig");

module.exports = {
    name: "pfps-channel",
    description: "Configure le salon des PFPs.",
    category: "avatar",

    async execute(client, message) {
        if (!message.guild) return;

        if (!message.member.permissions.has("ManageGuild")) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        "## 🎨 PFPs\n\n❌ Vous devez avoir la permission **Gérer le serveur**."
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const channel = message.mentions.channels.first();

        if (!channel) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        "## 🎨 PFPs\n\n" +
                        "Utilisation : `+pfps-channel #salon`"
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        if (!channel.isTextBased()) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        "## 🎨 PFPs\n\n❌ Le salon sélectionné n'est pas un salon textuel."
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const permissions = channel.permissionsFor(message.guild.members.me);

        if (
            !permissions ||
            !permissions.has("ViewChannel") ||
            !permissions.has("SendMessages")
        ) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        "## 🎨 PFPs\n\n❌ Je n'ai pas les permissions nécessaires dans ce salon."
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const currentConfig =
            guildConfig.get(message.guild.id, "pfpsConfig") || {};

        guildConfig.set(message.guild.id, "pfpsConfig", {
            ...currentConfig,
            enabled: true,
            channelId: channel.id,
            interval: 30000,
        });

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 🎨 PFPs configurées\n\n` +
                    `**Salon :** ${channel}\n` +
                    `**Intervalle :** toutes les **30 secondes**\n` +
                    `**Source :** membres connus par le bot\n` +
                    `**Statut :** 🟢 Activé`
                )
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });

        client.emit("pfpsStart", message.guild);
    },
};