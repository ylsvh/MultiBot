const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    name: 'servericon',
    aliases: ['sicon', 'iconserveur'],
    usage: 'servericon',
    description: 'Affiche l’icône du serveur.',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        const guild = message.guild;

        if (!guild) {
            return message.reply({
                content: 'Cette commande ne peut être utilisée que sur un serveur.'
            });
        }

        const iconURL = guild.iconURL({
            extension: 'png',
            size: 4096
        });

        if (!iconURL) {
            return message.reply({
                content: `${message.author}, ce serveur ne possède pas d'icône.`
            });
        }

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 🖼️ Icône du serveur\n\n` +
                    `**Serveur :** ${guild.name}\n` +
                    `**Demandée par :** ${message.author}`
                )
            )

            .addSeparatorComponents(
                new SeparatorBuilder()
            )

            .addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder()
                        .setURL(iconURL)
                        .setDescription(`Icône de ${guild.name}`)
                )
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Ouvrir l’image')
                    .setStyle(ButtonStyle.Link)
                    .setURL(iconURL)
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