const {
  AuditLogEvent,
  ChannelType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('discord.js');

const { sendLog } = require('../utils/logHelper');

const typeNames = {
  [ChannelType.GuildText]: 'Textuel',
  [ChannelType.GuildVoice]: 'Vocal',
  [ChannelType.GuildCategory]: 'Catégorie',
  [ChannelType.GuildAnnouncement]: 'Annonce',
  [ChannelType.GuildStageVoice]: 'Stage',
  [ChannelType.GuildForum]: 'Forum'
};

module.exports = {
  name: 'channelDelete',

  async execute(channel) {
    if (!channel.guild) return;

    let executor = null;

    try {
      await new Promise(resolve => setTimeout(resolve, 700));

      const logs = await channel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
        limit: 5
      });

      const entry = logs.entries.find(
        entry =>
          entry.target?.id === channel.id &&
          Date.now() - entry.createdTimestamp < 10000
      );

      executor = entry?.executor || null;
    } catch (error) {
      console.error('[LOG CHANNEL DELETE] AuditLog:', error);
    }

    const container = new ContainerBuilder()
      .setAccentColor(0xED4245);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 🗑️ Salon Supprimé')
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(1).setDivider(true)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**📌 Salon :** \`${channel.name}\`\n` +
        `**📂 Type :** ${typeNames[channel.type] || 'Inconnu'}\n` +
        `**🛠️ Par :** ${executor ? executor.tag : 'Inconnu'}\n` +
        `**🆔 ID :** \`${channel.id}\``
      )
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# <t:${Math.floor(Date.now() / 1000)}:F>`
      )
    );

    await sendLog(channel.guild, 'channels', container);
  }
};
