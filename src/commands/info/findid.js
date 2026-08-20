const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.js');

module.exports = {
  name: 'findid',
  aliases: ['find', 'id'],

  async execute(message, args) {
        await message.channel.sendTyping();
    const input = args[0];
    if (!input) return message.reply('Mention requise.');

    const member = message.mentions.members.first() || message.guild.members.cache.get(input);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(input);
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(input);

    const target = member || role || channel;
    if (!target) return message.reply('Introuvable.');

    const embed = new EmbedBuilder()
      .setColor('#2f3136')
      .setTitle('ID Finder')
      .addFields(
        { name: 'Cible', value: target.toString(), inline: true },
        { name: 'ID', value: `\`${target.id}\``, inline: true }
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }
};