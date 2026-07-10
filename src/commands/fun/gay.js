const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'gay',
    description: 'Calcule un pourcentage d’homosexualité (fun) d’un membre',
    async execute(client, message, args) {
        const member = message.mentions.members.first() || message.member;
        const percentage = Math.floor(Math.random() * 101);
        const embed = new EmbedBuilder()
            .setTitle(`🌈 Test d'homosexualité`)
            .setDescription(`${member.user.tag} est à **${percentage}% gay !** 🏳️‍🌈`)
            .setColor('#FF69B4')
            .setFooter({ text: 'Ceci est une commande troll, ne la prenez pas au sérieux !' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
