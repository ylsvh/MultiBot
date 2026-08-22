const {
  PermissionFlagsBits
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');
const { LOG_TYPES } = require('../../utils/logHelper');

module.exports = {
  name: 'setlogs',
  description: 'Définit le salon d’un type de logs',

  async execute(client, message, args) {
    if (!message.guild) return;

    if (
      !message.member.permissions.has(
        PermissionFlagsBits.Administrator
      )
    ) {
      return message.reply(
        '❌ Vous devez être administrateur pour utiliser cette commande.'
      );
    }

    const type = args[0]?.toLowerCase();

    if (!type || !LOG_TYPES[type]) {
      const types = Object.entries(LOG_TYPES)
        .map(
          ([key, value]) =>
            `\`${key}\` — ${value.label} — ${value.desc}`
        )
        .join('\n');

      return message.reply(
        `❌ Type de logs invalide.\n\n` +
        `**Types disponibles :**\n${types}\n\n` +
        `**Exemple :** \`${client.prefix}setlog messages #logs\``
      );
    }

    const channel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[1]);

    if (!channel) {
      return message.reply(
        `❌ Vous devez mentionner le salon où envoyer les logs.\n\n` +
        `Exemple : \`${client.prefix}setlog ${type} #logs\``
      );
    }

    if (!channel.isTextBased()) {
      return message.reply(
        '❌ Le salon sélectionné doit être un salon textuel.'
      );
    }

    const botMember = message.guild.members.me;

    if (!botMember) {
      return message.reply(
        '❌ Impossible de récupérer les permissions du bot.'
      );
    }

    const permissions = channel.permissionsFor(botMember);

    if (
      !permissions?.has(PermissionFlagsBits.ViewChannel) ||
      !permissions?.has(PermissionFlagsBits.SendMessages)
    ) {
      return message.reply(
        `❌ Je ne peux pas envoyer de messages dans ${channel}.`
      );
    }

    guildConfig.setLogChannel(
      message.guild.id,
      type,
      channel.id
    );

    return message.reply(
      `✅ Les logs **${LOG_TYPES[type].label}** seront désormais envoyés dans ${channel}.`
    );
  }
};