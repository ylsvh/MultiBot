const guildConfig = require('../../utils/guildConfig');

module.exports = {
  name: 'antiexe',
  description: 'Active ou désactive la protection contre les fichiers exécutables.',

  async execute(client, message, args) {
        await message.channel.sendTyping();
    if (!message.guild) return;

    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply(
        '❌ Vous devez avoir la permission **Gérer le serveur**.'
      );
    }

    const action = args[0]?.toLowerCase();

    if (
      action !== 'on' &&
      action !== 'off'
    ) {
      const current = guildConfig.get(
        message.guild.id,
        'antiexe'
      );

      return message.reply(
        `🛡️ AntiEXE : **${current ? 'activé' : 'désactivé'}**\n\n` +
        `Utilisation : \`+antiexe on\` ou \`+antiexe off\``
      );
    }

    const enabled = action === 'on';

    guildConfig.set(
      message.guild.id,
      'antiexe',
      enabled
    );

    return message.reply(
      enabled
        ? '✅ La protection **AntiEXE** est maintenant activée.'
        : '✅ La protection **AntiEXE** est maintenant désactivée.'
    );
  }
};