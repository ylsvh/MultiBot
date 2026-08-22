const {
  SlashCommandBuilder,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('discord.js');

const economy = require('../../utils/economy');

const WEEKLY_COOLDOWN = 7 * 24 * 60 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weekly')
    .setDescription('Récupère la récompense hebdomadaire.'),

  async execute(interaction, client) {
    const user = economy.getUserData(interaction.user.id);
    const now = Date.now();
    const lastWeekly = user.lastWeekly || 0;

    if (now - lastWeekly < WEEKLY_COOLDOWN) {
      const remaining = WEEKLY_COOLDOWN - (now - lastWeekly);
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor(
        (remaining % 86400000) / 3600000
      );

      const container = new ContainerBuilder()
        .setAccentColor(0xED4245);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '## ⏰ Weekly déjà récupéré'
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(1)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Tu dois encore attendre **${days}j ${hours}h**.\n` +
          `Prochain weekly : <t:${Math.floor(
            (lastWeekly + WEEKLY_COOLDOWN) / 1000
          )}:R>`
        )
      );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    let reward = economy.getRandomReward('weekly');

    const roleIds = interaction.member.roles.cache.map(
      role => role.id
    );

    const bonus = economy.getRoleBonus(
      interaction.guild.id,
      roleIds
    );

    reward = economy.applyRoleBonus(
      reward,
      bonus
    );

    economy.addCash(
      interaction.user.id,
      reward
    );

    economy.updateStats(
      interaction.user.id,
      'weeklyCount',
      1
    );

    user.lastWeekly = now;

    economy.updateUser(
      interaction.user.id,
      user
    );

    const container = new ContainerBuilder()
      .setAccentColor(0x3498DB);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '## 📆 Weekly récupéré'
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1)
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
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `⏰ Prochain weekly : <t:${Math.floor(
          (now + WEEKLY_COOLDOWN) / 1000
        )}:R>`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};