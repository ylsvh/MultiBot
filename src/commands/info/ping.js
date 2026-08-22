module.exports = {
  name: 'ping',
  description: 'Répond Pong !',
  async execute(client, message, args) {
        await message.channel.sendTyping();
    message.reply('🏓 Pong !');
  }
};
