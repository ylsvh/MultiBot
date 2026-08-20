const {
  AuditLogEvent,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('discord.js');

const { sendLog } = require('../utils/logHelper');

module.exports = {
  name: 'channelUpdate',

  async execute(oldChannel, newChannel) {
    if (!newChannel.guild) return;

    const changes = [];

    if (oldChannel.name !== newChannel.name) {
      changes.push(
        `**Nom :** \`${oldChannel.name}\` → \`${newChannel.name}\``
      );
    }

    if (oldChannel.topic !== newChannel.topic) {
      changes.push(
        `**Sujet :** \`${oldChannel.topic || 'aucun'}\` → \`${newChannel.topic || 'aucun'}\``
      );
    }

    if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
      changes.push(
        `**Slowmode :** \`${oldChannel.rateLimitPerUser || 0}s\` → \`${newChannel.rateLimitPerUser || 0}s\``
      );
    }

    if (oldChannel.nsfw !== newChannel.nsfw) {
      changes.push(
        `**NSFW :** \`${oldChannel.nsfw}\` → \`${newChannel.nsfw}\``
      );
    }

    if (String(oldChannel.parentId) !== String(newChannel.parentId)) {
      changes.push('**Catégorie :** déplacé');
    }

    if (!changes.length) return;

    let executor = null;

    try {
      await new Promise(resolve => setTimeout(resolve, 700));

      const logs = await newChannel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelUpdate,
        limit: 5
      });

      const entry = logs.entries.find(
        entry =>
          entry.target?.id === newChannel.id &&
          Date.now() - entry.createdTimestamp < 10000
      );

      executor = entry?.executor || null;
    } catch (error) {
      console.error('[LOG CHANNEL UPDATE] AuditLog:', error);
    }

    const container = new ContainerBuilder()
      .setAccentColor(0xFEE75C);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## ✏️ Salon Modifié')
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(1).setDivider(true)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**📌 Salon :** ${newChannel}\n` +
        `**🛠️ Par :** ${executor ? executor.tag : 'Inconnu'}\n\n` +
        `**📝 Modifications**\n${changes.join('\n')}`
      )
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# <t:${Math.floor(Date.now() / 1000)}:F>`
      )
    );

    await sendLog(newChannel.guild, 'channels', container);
  }
};
