const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'trans',
    description: 'Calcule un pourcentage de transsexualité (fun) d’un membre',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        const member = message.mentions.members.first() || message.member;

        const percentage = Math.floor(Math.random() * 101);

        const embed = new EmbedBuilder()
            .setTitle(`🌈 Test de transsexualité`)
            .setDescription(`${member.user.tag} est à **${percentage}% trans !** 🏳️‍⚧️`)
            .setColor('#FF69B4')
            .setFooter({ text: 'Ceci est une commande troll, ne la prenez pas au sérieux !' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
