const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'tutopoints',
    aliases: ['tutop', 'tpinfo'],
    usage: 'tutopoints',
    description: 'Explique le système de points.',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        const config = guildConfig.get(
            message.guild.id,
            'pointsConfig'
        );

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '# ⭐ Système de points\n\n' +
                    `Vous pouvez gagner des points de plusieurs manières sur ce serveur.`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 💬 Activité textuelle\n\n` +
                    `Chaque message rapporte **${config.messagePoints} point${config.messagePoints > 1 ? 's' : ''}**.\n\n` +
                    `## 🤖 Commandes\n\n` +
                    `Chaque commande utilisée rapporte **${config.commandPoints} point${config.commandPoints > 1 ? 's' : ''}**.\n\n` +
                    `## 🔊 Activité vocale\n\n` +
                    `Chaque minute passée en vocal rapporte **${config.voicePoints} point${config.voicePoints > 1 ? 's' : ''}**.`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 📊 Consulter ses points\n\n` +
                    `**Points actuels :** \`+points\`\n` +
                    `**Total cumulé :** \`+totalpoints\`\n` +
                    `**Position :** \`+position\`\n` +
                    `**Points par action :** \`+actionpoints\`\n` +
                    `**Couronne :** \`+couronne\``
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 🎯 Points actuels et total\n\n` +
                    `Les **points actuels** servent au classement et à la couronne.\n\n` +
                    `Le **total cumulé** conserve tous les points gagnés, même lorsqu'un cycle de classement est réinitialisé.`
                )
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};