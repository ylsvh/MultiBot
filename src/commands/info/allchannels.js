module.exports = {
  name: 'allchannels',
    description: 'Dit il y a combvien de channels sur le serveur',
    async execute(client, message, args) {
        await message.channel.sendTyping();
        const channelCount = message.guild.channels.cache.size;
        return message.reply(`Il y a ${channelCount} channels sur ce serveur.`);
    },
};
