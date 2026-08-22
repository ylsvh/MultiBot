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
        .setName('squirrel')
        .setDescription('Envoie une image d’écureuil.'),

    async execute(interaction, client) {
        try {
            const data = await getJSON(
                'https://some-random-api.com/animal/squirrel'
            );

            const container = new ContainerBuilder()
                .setAccentColor(0x8d6e63);

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent('## 🐿️ Squirrel')
            );

            container.addSeparatorComponents(
                new SeparatorBuilder()
                    .setDivider(true)
            );

            container.addMediaGalleryComponents(
                new MediaGalleryBuilder()
                    .addItems(
                        new MediaGalleryItemBuilder()
                            .setURL(data.image)
                    )
            );

            return interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch {
            return interaction.reply({
                content: '❌ Impossible de récupérer une image d’écureuil.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};