const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('discord.js');

const economy = require('../../utils/economy');

module.exports = {
  name: 'economy-role-list',
  description: 'Affiche les rôles économiques.',

  async execute(client, message) {
    await message.channel.sendTyping();

    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Cette commande est réservée aux administrateurs.');
    }

    const roles = economy.getGuildEconomyRoles(message.guild.id);
    const entries = Object.entries(roles);

    const container = new ContainerBuilder()
      .setAccentColor(0x5865F2);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 🎖️ Rôles économiques')
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(1)
    );

    if (!entries.length) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          'Aucun rôle économique configuré.'
        )
      );
    } else {
      const content = entries.map(([roleId, data]) => {
        const role = message.guild.roles.cache.get(roleId);

        return `${role || `\`<@&${roleId}>\``} → **+${data.bonus || 0}%**`;
      }).join('\n');

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content)
      );
    }

    return message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};