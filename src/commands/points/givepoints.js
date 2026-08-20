const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

const points = require('../../utils/points');

module.exports = {
    name: 'givepoints',
    aliases: ['givep', 'gp'],
    usage: 'givepoints <@membre> <nombre>',
    description: 'Donne des points à un membre.',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        const member =
            message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]);

        if (!member) {
            return message.reply({
                content: `${message.author}, veuillez mentionner un membre valide.`
            });
        }

        const amount = Number(args[1]);

        if (!Number.isInteger(amount) || amount <= 0) {
            return message.reply({
                content: `${message.author}, veuillez indiquer un nombre de points valide.`
            });
        }

        if (amount > 1000000) {
            return message.reply({
                content: `${message.author}, vous ne pouvez pas donner plus de **1 000 000 points** à la fois.`
            });
        }

        const data = points.addPoints(
            message.guild.id,
            member.id,
            amount
        );

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# ⭐ Points ajoutés\n\n` +
                    `**${message.author}** a donné **${amount.toLocaleString('fr-FR')} points** à ${member}.\n\n` +
                    `**Points actuels :** \`${data.current.toLocaleString('fr-FR')}\`\n` +
                    `**Points totaux :** \`${data.total.toLocaleString('fr-FR')}\``
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `*Les points donnés sont également comptabilisés dans le total cumulé.*`
                )
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};