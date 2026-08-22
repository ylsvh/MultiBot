const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dolphin')
        .setDescription('Envoie une image de dauphin.'),

    async execute(interaction, client) {
        const urls = [
            'https://images.unsplash.com/photo-1607153333879-c174d265f1d2',
            'https://images.unsplash.com/photo-1560275619-4662e36fa65c'
        ];

        const url = `${urls[Math.floor(Math.random() * urls.length)]}?auto=format&fit=crop&w=1200&q=85`;

        const container = new ContainerBuilder()
            .setAccentColor(0x2196f3);

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent('## 🐬 Dolphin')
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
                .setDivider(true)
        );

        container.addMediaGalleryComponents(
            new MediaGalleryBuilder()
                .addItems(
                    new MediaGalleryItemBuilder()
                        .setURL(url)
                )
        );

        return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};