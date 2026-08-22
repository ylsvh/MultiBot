const {
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
    name: 'fox',
    description: 'Envoie une image de renard.',

    async execute(client, message) {
        await message.channel.sendTyping();

        try {
            const data = await getJSON('https://randomfox.ca/floof/');

            const container = new ContainerBuilder()
                .setAccentColor(0xf4511e);

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## 🦊 Fox')
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder().setURL(data.image)
                )
            );

            return message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch {
            return message.reply('❌ Impossible de récupérer une image de renard.');
        }
    }
};