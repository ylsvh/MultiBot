const {
    SlashCommandBuilder,
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
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription("Afficher les informations d'un utilisateur")
        .addUserOption(option =>
            option
                .setName('utilisateur')
                .setDescription('Utilisateur à afficher')
                .setRequired(false)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('utilisateur') || interaction.user;

        const fetchedUser = await interaction.client.users.fetch(user.id).catch(() => user);
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const avatarURL = user.displayAvatarURL({ size: 256 });
        const bannerURL = fetchedUser.bannerURL?.({ size: 1024 }) ?? null;

        const color = member?.displayColor || 0x5865F2;

        const roles = member
            ? member.roles.cache
                .filter(r => r.id !== interaction.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(r => r.name)
                .join(', ') || 'Aucun'
            : 'Non membre';

        const roleCount = member
            ? member.roles.cache.filter(r => r.id !== interaction.guild.id).size
            : 0;

        const container = new ContainerBuilder()
            .setAccentColor(color);

        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${user.tag}${user.bot ? ' 🤖' : ''}\n` +
                        (member?.nickname ? `**Surnom :** ${member.nickname}\n` : '') +
                        `🆔 \`${user.id}\``
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(avatarURL)
                )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(1).setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### 📅 Dates\n` +
                `🛠️ Créé : <t:${Math.floor(user.createdTimestamp / 1000)}:F>\n` +
                (member
                    ? `📥 Rejoint : <t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
                    : '')
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(1).setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### 🎖️ Rôles (${roleCount})\n${roles}`
            )
        );

        if (bannerURL) {
            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(1)
            );

            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder()
                        .setURL(bannerURL)
                        .setDescription(`Bannière de ${user.tag}`)
                )
            );
        }

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(1)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `-# Demandé par ${interaction.user.tag}`
            )
        );

        return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};