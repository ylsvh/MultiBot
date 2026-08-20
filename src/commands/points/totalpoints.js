const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

const points = require('../../utils/points');

module.exports = {
    name: 'totalpoints',
    aliases: ['totalp', 'tp'],
    usage: 'totalpoints [@membre]',
    description: 'Affiche le total cumulé des points d’un membre.',

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

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 🏆 Total des points\n\n` +
                    `**Membre :** ${member}\n\n` +
                    `**Total cumulé :** \`${data.total.toLocaleString('fr-FR')} points\``
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `Les points totaux représentent tous les points gagnés par ce membre depuis son arrivée dans le système.`
                )
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};