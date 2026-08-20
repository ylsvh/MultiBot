const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');

module.exports = {
    name: 'speed',
    description: 'Affiche la latence du bot et de l\'API Discord',

    async execute(client, message, args) {
        const latency = Math.max(Date.now() - message.createdTimestamp, 0);
        const apiLatency = Math.round(client.ws.ping);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent('# 🏓 **Vitesse du bot**')
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `🤖 **Latence du bot :** ${latency}ms\n` +
                        `📡 **Latence API Discord :** ${apiLatency}ms`
                    )
            );

        await message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [container]
        });
    },
};
