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
        .setName('frog')
        .setDescription('Envoie une image de grenouille.'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const data = await getJSON(
                'https://some-random-api.com/animal/frog'
            );

            const container = new ContainerBuilder()
                .setAccentColor(0x4caf50);

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent('## 🐸 Frog')
            );

            container.addSeparatorComponents(
                new SeparatorBuilder()
                    .setDivider(true)
            );

            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder()
                        .setURL(data.image)
                )
            );

            return interaction.editReply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch {
            return interaction.editReply(
                '❌ Impossible de récupérer une image de grenouille.'
            );
        }
    }
};