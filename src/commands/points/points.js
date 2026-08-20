const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

const points = require('../../utils/points');

module.exports = {
    name: 'points',
    aliases: ['p'],
    usage: 'points [@membre]',
    description: 'Affiche les points actuels d’un membre.',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        const member =
            message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]) ||
            message.member;

        const data = points.getUserPoints(
            message.guild.id,
            member.id
        );

        const position = points.getPosition(
            message.guild.id,
            member.id
        );

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# ⭐ Points de ${member.displayName}\n\n` +
                    `**Membre :** ${member}\n` +
                    `**Points actuels :** \`${data.current.toLocaleString('fr-FR')}\`\n` +
                    `**Points totaux :** \`${data.total.toLocaleString('fr-FR')}\`\n` +
                    `**Position :** ${position ? `#${position}` : 'Non classé'}`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `*Les points actuels correspondent au cycle de classement en cours.*`
                )
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};