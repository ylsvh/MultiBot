const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

const points = require('../../utils/points');

module.exports = {
    name: 'position',
    aliases: ['pos', 'rank'],
    usage: 'position [@membre]',
    description: 'Affiche la position d’un membre dans le classement.',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        const member =
            message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]) ||
            message.member;

        const leaderboard = points.getLeaderboard(
            message.guild.id
        );

        const position = leaderboard.findIndex(
            entry => entry.userId === member.id
        ) + 1;

        const data = points.getUserPoints(
            message.guild.id,
            member.id
        );

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 🏅 Position\n\n` +
                    `**Membre :** ${member}\n\n` +
                    `**Position :** ${position > 0 ? `#${position}` : 'Non classé'}\n` +
                    `**Points :** \`${data.current.toLocaleString('fr-FR')}\`\n` +
                    `**Membres classés :** ${leaderboard.length.toLocaleString('fr-FR')}`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `*Le classement est basé sur les points du cycle actuel.*`
                )
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};