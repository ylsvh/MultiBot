const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');
const points = require('../../utils/points');

module.exports = {
    name: 'couronne',
    aliases: ['crown'],
    usage: 'couronne',
    description: 'Affiche le membre actuellement en tête du classement.',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        const config = guildConfig.get(
            message.guild.id,
            'pointsConfig'
        );

        const role = config.crownRoleId
            ? message.guild.roles.cache.get(config.crownRoleId)
            : null;

        const leaderboard = points.getLeaderboard(
            message.guild.id
        );

        const first = leaderboard[0];

        let champion = 'Personne';

        if (first) {
            const member = await message.guild.members
                .fetch(first.userId)
                .catch(() => null);

            if (member) {
                champion = `${member} — **${first.current.toLocaleString('fr-FR')} points**`;
            }
        }

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '# 👑 Couronne\n\n' +
                    `**Membre en tête :** ${champion}\n\n` +
                    `**Rôle de la couronne :** ${role || 'Aucun rôle configuré'}\n` +
                    `**Calendrier :** ${config.crownSchedule || 'Aucun calendrier configuré'}`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    role
                        ? `Le membre possédant le plus de points actuels est le détenteur de la couronne.`
                        : `Aucun rôle de couronne n'est actuellement configuré sur ce serveur.`
                )
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};