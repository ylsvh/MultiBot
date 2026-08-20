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
    name: 'cat',
    description: 'Envoie une image de chat.',

    async execute(client, message) {
        await message.channel.sendTyping();

        try {
            const data = await getJSON('https://api.thecatapi.com/v1/images/search');

            const container = new ContainerBuilder()
                .setAccentColor(0xffa726);

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## 🐱 Cat')
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder().setURL(data[0].url)
                )
            );

            return message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch {
            return message.reply('❌ Impossible de récupérer une image de chat.');
        }
    }
};