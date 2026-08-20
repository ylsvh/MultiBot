const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'pubmp',
    description: 'Message informatif sur les publicités en MP',
    async execute(client, message, args) {
        await message.channel.sendTyping();
        const embed = new EmbedBuilder()
            .setTitle('📩 En cas de publicité en message privé')
            .setDescription(`Si vous recevez une publicité non sollicitée en MP depuis ce serveur, merci de nous signaler les informations suivantes :

• **Identifiant** du membre pubeur
• **Capture d'écran** / preuve de la pub

Contactez un membre du staff ou ouvrez un ticket pour qu'un modérateur traite votre signalement rapidement.`)
            .setColor('#2f3136')
            .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });
        message.channel.send({ embeds: [embed] });
    }
};
