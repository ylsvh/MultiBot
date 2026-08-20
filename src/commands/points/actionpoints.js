const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'actionpoints',
    aliases: ['actpoint', 'ap'],
    usage: 'actionpoints',
    description: 'Affiche le nombre de points gagnés par action.',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        const config = guildConfig.get(message.guild.id, 'pointsConfig');

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '# ⭐ Points par action\n\n' +
                    `**💬 Message**\n` +
                    `${config.messagePoints} point${config.messagePoints > 1 ? 's' : ''} par message\n\n` +
                    `**🤖 Commande**\n` +
                    `${config.commandPoints} point${config.commandPoints > 1 ? 's' : ''} par commande\n\n` +
                    `**🔊 Vocal**\n` +
                    `${config.voicePoints} point${config.voicePoints > 1 ? 's' : ''} par minute`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `*Les points sont propres à ce serveur.*`
                )
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};