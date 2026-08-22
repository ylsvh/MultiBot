const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'tempcmute',
  description: 'Rendre temporairement muet un membre du serveur dans le salon actuel.',

  async execute(client, message, args) {

    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply("❌ Tu n'as pas la permission de mute des membres.");
    }

    const target =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (!target) {
      return message.reply("❌ Utilisation : `+tempcmute @membre [raison]`.");
    }

    if (target.id === message.author.id) {
      return message.channel.send("❌ Tu ne peux pas te mute toi-même.");
    }

    if (target.id === client.user.id) {
      return message.channel.send("❌ Je ne peux pas me mute moi-même.");
    }

    if (
      message.guild.ownerId !== message.author.id &&
      target.roles.highest.position >=
      message.member.roles.highest.position
    ) {
      return message.channel.send(
        "❌ Ce membre a un rôle égal ou supérieur au tien."
      );
    }

    if (!target.moderatable) {
      return message.channel.send(
        "❌ Je ne peux pas mute ce membre. Vérifie mes permissions et mon rôle."
      );
    }

    const reason =
      args.slice(1).join(' ') || 'Aucune raison fournie';

    try {

      await target.timeout(10 * 60 * 1000, reason);

      message.channel.send(
        `✅ ${target.user.tag} a été temporairement muté pendant 10 minutes. Raison : ${reason}`
      );

    } catch (error) {

      console.error(error);

      message.channel.send(
        "❌ Une erreur est survenue en tentant de muter le membre."
      );
    }
  },
};
