const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags,
    ChannelType
} = require('discord.js');

module.exports = {
    name: 'saloninfo',
    aliases: ['channelinfo', 'sinfo'],
    usage: 'saloninfo [#salon]',
    description: 'Affiche les informations d’un salon Discord.',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        const channel =
            message.mentions.channels.first() ||
            message.guild.channels.cache.get(args[0]) ||
            message.channel;

        if (!channel) {
            return message.reply({
                content: `${message.author}, salon introuvable.`
            });
        }

        const typeNames = {
            [ChannelType.GuildText]: 'Salon textuel',
            [ChannelType.GuildVoice]: 'Salon vocal',
            [ChannelType.GuildCategory]: 'Catégorie',
            [ChannelType.GuildAnnouncement]: 'Salon d’annonces',
            [ChannelType.GuildStageVoice]: 'Salon Stage',
            [ChannelType.GuildForum]: 'Forum',
            [ChannelType.GuildMedia]: 'Média'
        };

        const type = typeNames[channel.type] || 'Inconnu';

        const createdAt = `<t:${Math.floor(channel.createdTimestamp / 1000)}:F>`;
        const createdRelative = `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`;

        let extraInfo = '';

        if (channel.isTextBased()) {
            extraInfo +=
                `**Messages :** ${channel.messages?.cache.size?.toLocaleString('fr-FR') || '0'} en cache\n`;
        }

        if (channel.isVoiceBased()) {
            extraInfo +=
                `**Utilisateurs connectés :** ${channel.members?.size?.toLocaleString('fr-FR') || '0'}\n` +
                `**Limite d’utilisateurs :** ${channel.userLimit || 'Aucune'}\n` +
                `**Débit :** ${channel.bitrate ? `${Math.round(channel.bitrate / 1000)} kbps` : 'N/A'}\n`;
        }

        if (channel.parent) {
            extraInfo += `**Catégorie :** ${channel.parent}\n`;
        }

        if (channel.topic) {
            extraInfo += `**Description :** ${channel.topic}\n`;
        }

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# ℹ️ Informations du salon\n\n` +
                    `## ${channel.name}\n\n` +
                    `**ID :** \`${channel.id}\`\n` +
                    `**Type :** ${type}\n` +
                    `**Position :** ${channel.position}\n` +
                    `**Créé le :** ${createdAt}\n` +
                    `**Créé :** ${createdRelative}\n` +
                    `${extraInfo}`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 🔐 Permissions\n\n` +
                    `**Permissions personnalisées :** ${channel.permissionOverwrites?.cache.size || 0}\n` +
                    `**NSFW :** ${channel.nsfw !== undefined ? (channel.nsfw ? 'Oui' : 'Non') : 'N/A'}`
                )
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Accéder au salon')
                    .setStyle(ButtonStyle.Link)
                    .setURL(
                        `https://discord.com/channels/${message.guild.id}/${channel.id}`
                    )
            );

        await message.reply({
            components: [
                container,
                buttons
            ],
            flags: MessageFlags.IsComponentsV2
        });
    }
};