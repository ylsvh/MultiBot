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
        .setName('roblox-game')
        .setDescription("Affiche les informations d'un jeu Roblox")
        .addStringOption(option =>
            option
                .setName('lien')
                .setDescription('Lien du jeu Roblox')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const url = interaction.options.getString('lien');

        const match = url.match(/roblox\.com\/games\/(\d+)/);

        if (!match) {
            return interaction.editReply('❌ Lien Roblox invalide.');
        }

        const placeId = match[1];

        try {
            const uniRes = await fetch(
                `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
            );

            const uniData = await uniRes.json();
            const universeId = uniData?.universeId;

            if (!universeId) {
                return interaction.editReply('❌ Universe introuvable.');
            }

            const gameRes = await fetch(
                `https://games.roblox.com/v1/games?universeIds=${universeId}`
            );

            const gameData = await gameRes.json();

            if (!gameData?.data || !gameData.data.length) {
                return interaction.editReply(
                    '❌ Impossible de récupérer ce jeu.'
                );
            }

            const game = gameData.data[0];

            const thumbRes = await fetch(
                `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png`
            );

            const thumbData = await thumbRes.json();

            const thumbnail =
                thumbData?.data?.[0]?.imageUrl || null;

            const creatorName =
                game.creator?.name || 'Inconnu';

            const container = new ContainerBuilder()
                .setAccentColor(0x00A2FF);

            container.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## 🎮 [${game.name}](https://www.roblox.com/games/${placeId})\n` +
                            `${game.description || '*Aucune description.*'}`
                        )
                    )
                    .setThumbnailAccessory(
                        thumbnail
                            ? new ThumbnailBuilder().setURL(thumbnail)
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
                    `**👤 Créateur :** ${creatorName} · **🎮 Joueurs :** ${game.playing ?? 0}\n` +
                    `**👀 Visites :** ${game.visits ?? 0} · **👍 Likes :** ${game.upVotes ?? 0}`
                )
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '-# Roblox Game Info'
                )
            );

            return interaction.editReply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (err) {
            console.error(err);

            return interaction.editReply(
                '❌ Impossible de récupérer les informations du jeu.'
            );
        }
    }
};