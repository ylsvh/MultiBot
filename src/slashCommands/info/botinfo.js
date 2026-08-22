const {
    SlashCommandBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags
} = require('discord.js');

const config = require('../../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Affiche les informations du bot.'),

    async execute(interaction, client) {
        const ownerId =
            config.ownerId ||
            config.ownerID ||
            config.owner ||
            config.owner_id ||
            'Non configuré';

        const botUser = client.user;

        const commands =
            client.commands?.size ||
            client.commands?.length ||
            0;

        const guilds = client.guilds?.cache?.size || 0;

        const users =
            client.guilds?.cache?.reduce(
                (total, guild) =>
                    total + (guild.memberCount || 0),
                0
            ) || 0;

        const channels =
            client.channels?.cache?.size || 0;

        const uptime = client.uptime || 0;

        const seconds = Math.floor(uptime / 1000);
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const uptimeText =
            `${days}j ${hours}h ${minutes}m ${secs}s`;

        const createdAt = botUser.createdTimestamp
            ? `<t:${Math.floor(botUser.createdTimestamp / 1000)}:F>`
            : 'Inconnu';

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 🤖 Informations du bot\n\n` +
                    `## ${botUser.username}\n\n` +
                    `**ID :** \`${botUser.id}\`\n` +
                    `**Owner ID :** \`${ownerId}\`\n` +
                    `**Créé le :** ${createdAt}`
                )
            )

            .addSeparatorComponents(
                new SeparatorBuilder()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 📊 Statistiques\n\n` +
                    `**Commandes :** ${commands.toLocaleString('fr-FR')}\n` +
                    `**Serveurs :** ${guilds.toLocaleString('fr-FR')}\n` +
                    `**Utilisateurs :** ${users.toLocaleString('fr-FR')}\n` +
                    `**Salons en cache :** ${channels.toLocaleString('fr-FR')}\n` +
                    `**Uptime :** ${uptimeText}`
                )
            )

            .addSeparatorComponents(
                new SeparatorBuilder()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ⚙️ Système\n\n` +
                    `**Discord.js :** ${require('discord.js').version}\n` +
                    `**Node.js :** ${process.version}\n` +
                    `**Plateforme :** ${process.platform}\n` +
                    `**Architecture :** ${process.arch}`
                )
            )

            .addSeparatorComponents(
                new SeparatorBuilder()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 📡 Connexion\n\n` +
                    `**Ping WebSocket :** ${client.ws.ping}ms\n` +
                    `**Mémoire utilisée :** ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`
                )
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Inviter le bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL(
                        `https://discord.com/oauth2/authorize?client_id=${botUser.id}&permissions=8&scope=bot%20applications.commands`
                    )
            );

        return interaction.reply({
            components: [
                container,
                buttons
            ],
            flags: MessageFlags.IsComponentsV2
        });
    }
};