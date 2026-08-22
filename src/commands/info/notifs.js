const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'notifs',
    description: 'Affiche un message concernant les rôles du serveur',
    async execute(client, message, args) {
        await message.channel.sendTyping();
        const iconURL = message.guild.iconURL({ dynamic: true, size: 256})
        const embed = new EmbedBuilder()
            .setColor('#fffb00')
            .setTitle('🎭 ・Comment avoir des rôles sur le serveur ?')
            .setDescription('Pour obtenir des rôles sur le serveur, il suffit d\'aller dans le menu <id:customize> et de cliquer sur les rôles qui vous correspondent le mieux.')
            .setImage('https://cdn.discordapp.com/attachments/1505102292670615572/1505102690471116932/image.png?ex=6a09679c&is=6a08161c&hm=a951bd51abf8c627ae220166d2c91a3badaf1bec6b30cfab7e5acabc09faecca&')
            .setThumbnail(iconURL)
        message.channel.send({ embeds: [embed] });
    }
};