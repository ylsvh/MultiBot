const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
  name: 'honeypot',
  description: 'Configure ou désactive un salon Honeypot.',

  async execute(client, message, args) {
        await message.channel.sendTyping();
    if (!message.guild) return;

    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply(
        '❌ Vous devez avoir la permission **Gérer le serveur**.'
      );
    }

    const currentChannelId = guildConfig.get(
      message.guild.id,
      'honeypotChannel'
    );

    /*
     * +honeypot off
     * Désactive le Honeypot.
     */
    if (
      args[0]?.toLowerCase() === 'off' ||
      args[0]?.toLowerCase() === 'disable' ||
      args[0]?.toLowerCase() === 'remove'
    ) {
      if (!currentChannelId) {
        return message.reply(
          '❌ Aucun Honeypot n’est actuellement configuré.'
        );
      }

      guildConfig.set(
        message.guild.id,
        'honeypotChannel',
        null
      );

      return message.reply(
        '✅ Le Honeypot a été désactivé.'
      );
    }

    /*
     * Configuration du Honeypot.
     */
    const channel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[0]);

    if (!channel) {
      return message.reply(
        '❌ Utilisation : `+honeypot #salon` ou `+honeypot off`.'
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
        '❌ Impossible de récupérer le membre du bot.'
      );
    }

    if (!botMember.permissions.has('BanMembers')) {
      return message.reply(
        '❌ Le bot doit avoir la permission **Bannir des membres**.'
      );
    }

    if (!botMember.permissions.has('ManageMessages')) {
      return message.reply(
        '❌ Le bot doit avoir la permission **Gérer les messages**.'
      );
    }

    guildConfig.set(
      message.guild.id,
      'honeypotChannel',
      channel.id
    );

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '# 🍯 Honeypot\n\n' +
          `> ${channel}\n\n` +
          'Ce salon est un **Honeypot**.\n\n' +
          'Toute personne qui envoie **le moindre message** dans ce salon sera automatiquement **bannie du serveur**.\n\n' +
          '⚠️ Cette règle s’applique également aux **bots**.'
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          'Ne rien envoyer dans ce salon.'
        )
      );

    await channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    await message.reply(
      `✅ Le salon ${channel} est maintenant configuré comme Honeypot.\n\n` +
      `Pour le désactiver : \`+honeypot off\``
    );
  }
};