const guildConfig = require('../../utils/guildConfig');

module.exports = {
  name: 'setwelcomemessage',
  description: 'Définit le message envoyé lors de l’arrivée d’un membre.',

  async execute(client, message, args) {
    await message.channel.sendTyping();

    if (!message.guild) return;

    if (!message.member.permissions.has('Administrator')) {
      return message.reply(
        '❌ Vous devez être administrateur pour utiliser cette commande.'
      );
    }

    const content = args.join(' ').trim();

    if (!content) {
      return message.reply(
        '❌ Vous devez fournir un message.\n\n' +
        '**Variables disponibles :**\n' +
        '`{user}` → mention du membre\n' +
        '`{username}` → nom du membre\n' +
        '`{tag}` → tag Discord du membre\n' +
        '`{server}` → nom du serveur\n' +
        '`{count}` → nombre de membres\n\n' +
        '**Exemple :**\n' +
        '`+setwelcomemessage Bienvenue {user} sur {server} ! Nous sommes maintenant {count} membres.`'
      );
    }

    guildConfig.set(
      message.guild.id,
      'welcomeMessage',
      content
    );

    const preview = content
      .replaceAll(
        '{user}',
        message.member.toString()
      )
      .replaceAll(
        '{username}',
        message.member.user.username
      )
      .replaceAll(
        '{tag}',
        message.member.user.tag
      )
      .replaceAll(
        '{server}',
        message.guild.name
      )
      .replaceAll(
        '{count}',
        String(message.guild.memberCount)
      );

    return message.reply(
      `✅ Message de bienvenue configuré.\n\n` +
      `**Aperçu :**\n> ${preview}`
    );
  }
};