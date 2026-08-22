const guildConfig = require('../../utils/guildConfig');

module.exports = {
  name: 'setwelcome',
  description: 'Définit le salon des messages de bienvenue.',

  async execute(client, message, args) {
    await message.channel.sendTyping();

    if (!message.guild) return;

    if (!message.member.permissions.has('Administrator')) {
      return message.reply(
        '❌ Vous devez être administrateur pour utiliser cette commande.'
      );
    }

    const channel = message.mentions.channels.first();

    if (!channel) {
      return message.reply(
        '❌ Vous devez mentionner un salon.\n\n' +
        'Exemple : `+setwelcome #bienvenue`'
      );
    }

    if (!channel.isTextBased()) {
      return message.reply(
        '❌ Le salon sélectionné doit être un salon textuel.'
      );
    }

    guildConfig.set(
      message.guild.id,
      'welcomeChannelId',
      channel.id
    );

    return message.reply(
      `✅ Le salon de bienvenue a été défini sur ${channel}.`
    );
  }
};