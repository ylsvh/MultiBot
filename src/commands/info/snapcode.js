const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    name: 'snapcode',
    usage: 'snapcode <pseudo>',
    description: 'Recherche le SnapCode d’un utilisateur Snapchat.',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        if (!args.length) {
            return message.reply({
                content: `${message.author}, veuillez indiquer un pseudo Snapchat.`,
            });
        }

        const pseudo = args[0];

        const snapcode = `https://feelinsonice.appspot.com/web/deeplink/snapcode?username=${encodeURIComponent(pseudo)}&size=320&type=PNG`;

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 👻 SnapCode\n\n` +
                    `${message.author}, voici le SnapCode de **${pseudo}**.`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder()
                        .setURL(snapcode)
                        .setDescription(`SnapCode de ${pseudo}`)
                )
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};