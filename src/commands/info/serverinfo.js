const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
} = require('discord.js');

module.exports = {
    name: 'serverinfo',
    description: 'Afficher les informations du serveur',
    async execute(client, message, args) {
        await message.channel.sendTyping();
        const { guild } = message;
        await guild.fetch();

        const owner = await guild.fetchOwner().catch(() => null);
        const iconURL = guild.iconURL({ dynamic: true, size: 256 })
            || 'https://cdn.discordapp.com/embed/avatars/0.png';
        const bannerURL = guild.bannerURL({ size: 1024 });

        const textChannels  = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const categories    = guild.channels.cache.filter(c => c.type === 4).size;
        const bots          = guild.members.cache.filter(m => m.user.bot).size;
        const boosts        = guild.premiumSubscriptionCount || 0;
        const boostTier     = guild.premiumTier;
        const verif = { 0: 'Aucune', 1: 'Faible', 2: 'Moyenne', 3: 'Élevée', 4: 'Très élevée' };

        const container = new ContainerBuilder().setAccentColor(0x5865F2);

        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${guild.name}\n` +
                        (guild.description ? `*${guild.description}*\n` : '') +
                        `🆔 \`${guild.id}\`\n` +
                        `👑 **Propriétaire :** ${owner ? owner.toString() : `<@${guild.ownerId}>`}`
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(iconURL)
                )
        );

        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true));

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### 👥 Membres\n` +
                `👤 **${guild.memberCount}** membres (dont 🤖 **${bots}** bots)\n` +
                `💎 **${boosts}** boosts — Niveau **${boostTier}** · 🎖️ **${guild.roles.cache.size - 1}** rôles`
            )
        );

        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1));

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### 📋 Salons\n` +
                `💬 **${textChannels}** textuels · 🔊 **${voiceChannels}** vocaux · 📁 **${categories}** catégories\n` +
                `😀 **${guild.emojis.cache.size}** emojis · 🎭 **${guild.stickers.cache.size}** stickers`
            )
        );

        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true));

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### ⚙️ Paramètres\n` +
                `🌐 Langue : \`${guild.preferredLocale}\` · 🛡️ Vérification : **${verif[guild.verificationLevel] ?? '?'}**\n` +
                `📅 Créé le <t:${Math.floor(guild.createdTimestamp / 1000)}:F> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)\n` +
                `-# Demandé par ${message.author.tag}`
            )
        );

        if (bannerURL) {
            container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1));
            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder()
                        .setURL(bannerURL)
                        .setDescription(`Bannière — ${guild.name}`)
                )
            );
        }

        await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
};
