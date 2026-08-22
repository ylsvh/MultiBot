const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder
} = require('discord.js');

const https = require('https');

function getJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let data = '';

            res.on('data', chunk => data += chunk);

            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(new Error('Réponse invalide'));
                }
            });
        }).on('error', reject);
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('Envoie une image de chat.'),

    async execute(interaction, client) {
        try {
            const data = await getJSON(
                'https://api.thecatapi.com/v1/images/search'
            );

            const container = new ContainerBuilder()
                .setAccentColor(0xffa726);

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent('## 🐱 Cat')
            );

            container.addSeparatorComponents(
                new SeparatorBuilder()
                    .setDivider(true)
            );

            container.addMediaGalleryComponents(
                new MediaGalleryBuilder()
                    .addItems(
                        new MediaGalleryItemBuilder()
                            .setURL(data[0].url)
                    )
            );

            return interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch {
            return interaction.reply({
                content: '❌ Impossible de récupérer une image de chat.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};