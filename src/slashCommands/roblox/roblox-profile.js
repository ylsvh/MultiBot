const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roblox-profile')
        .setDescription("Affiche le profil d'un utilisateur Roblox")
        .addStringOption(option =>
            option
                .setName('username')
                .setDescription('Nom d’utilisateur Roblox')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const username = interaction.options.getString('username');

        try {
            const userRes = await fetch(
                'https://users.roblox.com/v1/usernames/users',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'DiscordBot',
                    },
                    body: JSON.stringify({
                        usernames: [username],
                        excludeBannedUsers: false,
                    }),
                }
            );

            const userData = await userRes.json();

            if (!userData.data || !userData.data[0]) {
                return interaction.editReply(
                    '❌ Utilisateur introuvable.'
                );
            }

            const userId = userData.data[0].id;

            const profileRes = await fetch(
                `https://users.roblox.com/v1/users/${userId}`
            );

            const profile = await profileRes.json();

            const avatarRes = await fetch(
                `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`
            );

            const avatarData = await avatarRes.json();

            const avatar =
                avatarData?.data?.[0]?.imageUrl || null;

            const container = new ContainerBuilder()
                .setAccentColor(0xFFEE00);

            container.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## 🎮 [${profile.name}](https://www.roblox.com/users/${userId}/profile)\n` +
                            `👤 Display Name : **${profile.displayName || 'Aucun'}** · 🆔 \`${profile.id}\``
                        )
                    )
                    .setThumbnailAccessory(
                        avatar
                            ? new ThumbnailBuilder().setURL(avatar)
                            : new ThumbnailBuilder().setURL(
                                'https://cdn.discordapp.com/embed/avatars/0.png'
                            )
                    )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing(1)
                    .setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**📅 Créé le :** <t:${Math.floor(new Date(profile.created).getTime() / 1000)}:D>\n\n` +
                    `**📝 Bio :**\n${profile.description || '*Aucune description*'}`
                )
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '-# Roblox'
                )
            );

            return interaction.editReply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (err) {
            console.error(err);

            return interaction.editReply(
                '❌ Erreur lors de la récupération du profil.'
            );
        }
    },
};