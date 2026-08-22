const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('discord.js');

const economy = require('../../utils/economy');

const MONTHLY_COOLDOWN = 30 * 24 * 60 * 60 * 1000;

module.exports = {
  name: 'monthly',
  description: 'Récupère la récompense mensuelle.',

  async execute(client, message) {
    await message.channel.sendTyping();

    const user = economy.getUserData(message.author.id);
    const now = Date.now();
    const lastMonthly = user.lastMonthly || 0;

    if (now - lastMonthly < MONTHLY_COOLDOWN) {
      const remaining = MONTHLY_COOLDOWN - (now - lastMonthly);
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);

      const container = new ContainerBuilder()
        .setAccentColor(0xED4245);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## ⏰ Monthly déjà récupéré')
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(1)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Tu dois encore attendre **${days}j ${hours}h**.\n` +
          `Prochain monthly : <t:${Math.floor((lastMonthly + MONTHLY_COOLDOWN) / 1000)}:R>`
        )
      );

      return message.channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    let reward = economy.getRandomReward('monthly');

    const roleIds = message.member.roles.cache.map(role => role.id);
    const bonus = economy.getRoleBonus(message.guild.id, roleIds);

    reward = economy.applyRoleBonus(reward, bonus);

    economy.addCash(message.author.id, reward);
    economy.updateStats(message.author.id, 'monthlyCount', 1);

    user.lastMonthly = now;
    economy.updateUser(message.author.id, user);

    const container = new ContainerBuilder()
      .setAccentColor(0x9B59B6);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 📅 Monthly récupéré')
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `💰 **+${reward.toLocaleString()} coins**`
      )
    );

    if (bonus > 0) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `🎖️ Bonus de rôle : **+${bonus}%**`
        )
      );
    }

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `💎 Nouveau total : **${economy.getUserData(message.author.id).cash.toLocaleString()} coins**\n` +
        `⏰ Prochain monthly : <t:${Math.floor((now + MONTHLY_COOLDOWN) / 1000)}:R>`
      )
    );

    return message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};