const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    name: 'roulette-russe',
    aliases: ['roulette', 'russianroulette'],
    usage: 'roulette-russe',
    description: 'Joue à la roulette russe.',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        const bulletPosition = Math.floor(Math.random() * 6) + 1;
        const currentPosition = Math.floor(Math.random() * 6) + 1;

        const isDead = bulletPosition === currentPosition;

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 🎲 Roulette russe\n\n` +
                    `**${message.author.username}** tente sa chance...\n\n` +
                    `🔫 Le barillet tourne...\n` +
                    `🔫 Le barillet s'arrête...\n`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    isDead
                        ? `# 💀 BANG !\n\n` +
                          `**${message.author.username} a perdu.**\n` +
                          `La balle était dans la chambre.\n\n` +
                          `**Résultat :** 💀 Éliminé`
                        : `# 😮 CLIC !\n\n` +
                          `**${message.author.username} survit.**\n` +
                          `Aucune balle dans la chambre.\n\n` +
                          `**Résultat :** 🟢 Vivant`
                )
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
