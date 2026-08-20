const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
  PermissionFlagsBits
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');
const { LOG_TYPES } = require('../../utils/logHelper');

module.exports = {
  name: 'autologs',
  description: 'Configure un salon unique pour tous les logs automatiques',

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

    const channel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[0]);

    if (!channel) {
      return message.reply(
        '❌ Vous devez mentionner un salon.\n\n' +
        `Exemple : \`${client.prefix}autologs #logs\``
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

    const logChannels = {};

    for (const type of Object.keys(LOG_TYPES)) {
      logChannels[type] = channel.id;
    }

    guildConfig.set(
      message.guild.id,
      'logChannels',
      logChannels
    );

    const container = new ContainerBuilder()
      .setAccentColor(0x5865F2);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '## 📜 Logs automatiques configurés'
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `Tous les logs automatiques seront désormais envoyés dans ${channel}.\n\n` +
        Object.values(LOG_TYPES)
          .map(log => `> ${log.label} — ${log.desc}`)
          .join('\n')
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# Configuration effectuée par ${message.author.tag}`
      )
    );

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};