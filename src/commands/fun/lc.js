const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'lc',
    description: 'Calcule le pourcentage d’amour entre deux membres',

    async execute(client, message, args) {
        const member1 = message.mentions.members.first();
        const member2 = message.mentions.members.last() || message.member;
        if (!member1) return message.reply("❌ Mentionne au moins un membre !");
        const lovePercent = Math.floor(Math.random() * 101);
        const totalHearts = 10;
        const fullHearts = Math.round((lovePercent / 100) * totalHearts);
        const emptyHearts = totalHearts - fullHearts;
        const heartBar = '❤️'.repeat(fullHearts) + '🖤'.repeat(emptyHearts);
        const embed = new EmbedBuilder()
            .setTitle('💖 Love Calculator 💖')
            .setDescription(`💘 **${member1.user.username}** + **${member2.user.username}** 💘`)
            .addFields(
                { name: 'Pourcentage d’amour', value: `**${lovePercent}%**`, inline: true },
                { name: 'Affection', value: heartBar, inline: false }
            )
            .setColor('#FF69B4')
            .setThumbnail(member1.user.displayAvatarURL({ dynamic: true }))
            .setImage(member2.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Love Calculator ❤️' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
