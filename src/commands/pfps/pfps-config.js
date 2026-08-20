const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
} = require("discord.js");

const guildConfig = require("../../utils/guildConfig");

module.exports = {
    name: "pfps-config",
    description: "Affiche la configuration des PFPs.",
    category: "avatar",

    async execute(client, message) {
        if (!message.guild) return;

        const config =
            guildConfig.get(message.guild.id, "pfpsConfig");

        if (!config?.enabled || !config.channelId) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        "## 🎨 Configuration PFPs\n\n" +
                        "**Statut :** 🔴 Désactivé\n\n" +
                        "Utilisez `+pfps-channel #salon` pour configurer le système."
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const channel = message.guild.channels.cache.get(
            config.channelId
        );

        const knownUsers = client.users.cache.size;

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    "## 🎨 Configuration PFPs"
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Statut :** 🟢 Activé\n` +
                    `**Salon :** ${channel || `<#${config.channelId}>`}\n` +
                    `**Intervalle :** toutes les **30 secondes**\n` +
                    `**Utilisateurs connus :** ${knownUsers}\n` +
                    `**Source :** utilisateurs connus par le bot`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    "-# Le bot sélectionne aléatoirement une PFP parmi les utilisateurs qu'il connaît."
                )
            );

        return message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};