const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder
} = require('discord.js');

module.exports = {
    name: '67',
    description: 'Envoie un GIF 67.',

    async execute(client, message) {
        await message.channel.sendTyping();

        const gifs = [
            'https://media.tenor.com/2ROhL5aXGvUAAAAC/67.gif',
            'https://media.tenor.com/7J0LqH8X5YAAAAAC/67.gif'
        ];

        const gif = gifs[Math.floor(Math.random() * gifs.length)];

        const container = new ContainerBuilder()
            .setAccentColor(0x5865f2);

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 67')
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true)
        );

        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder().setURL(gif)
            )
        );

        return message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};