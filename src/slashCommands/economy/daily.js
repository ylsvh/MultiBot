const {
  SlashCommandBuilder,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const economy = require('../../utils/economy');

const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;

const DAILY_REWARDS = [
  { amount: 100, emoji: '🥉', name: 'Bronze' },
  { amount: 250, emoji: '🥈', name: 'Argent' },
  { amount: 500, emoji: '🥇', name: 'Or' },
  { amount: 1000, emoji: '💎', name: 'Diamant' },
  { amount: 2000, emoji: '👑', name: 'Royal' }
];

const STREAK_BONUSES = [
  { streak: 7, bonus: 500, name: 'Semaine complète' },
  { streak: 14, bonus: 1500, name: 'Deux semaines' },
  { streak: 30, bonus: 5000, name: 'Mois complet' },
  { streak: 100, bonus: 25000, name: 'Century Club' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Récupère ta récompense quotidienne.'),

  async execute(interaction, client) {
    const userData = economy.getUserData(interaction.user.id);

    const now = Date.now();
    const lastDaily = userData.lastDaily || 0;

    if (now - lastDaily < DAILY_COOLDOWN) {
      const remaining = DAILY_COOLDOWN - (now - lastDaily);
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);

      const container = new ContainerBuilder()
        .setAccentColor(0xff0000);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## ⏰ Daily déjà récupéré`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Tu dois attendre **${h}h ${m}min** avant de récupérer ta récompense.`
        )
      );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const yesterday = now - DAILY_COOLDOWN;
    const maintained = lastDaily >= yesterday - 7200000;
    const streak = maintained
      ? (userData.dailyStreak || 0) + 1
      : 1;

    const reward =
      DAILY_REWARDS[
        Math.floor(Math.random() * DAILY_REWARDS.length)
      ];

    let total = reward.amount;
    let bonus = 0;

    for (const b of STREAK_BONUSES) {
      if (streak >= b.streak) {
        bonus = b.bonus;
        total += b.bonus;
      }
    }

    economy.addCash(interaction.user.id, total);
    economy.updateStats(
      interaction.user.id,
      'dailyCount',
      1
    );

    const updated = economy.getUserData(interaction.user.id);

    updated.lastDaily = now;
    updated.dailyStreak = streak;

    economy.updateUser(
      interaction.user.id,
      updated
    );

    const container = new ContainerBuilder()
      .setAccentColor(0x00ff00);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 🎁 Daily récupéré !`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${reward.emoji} **${reward.name}**\n` +
        `💰 Gain : **${reward.amount.toLocaleString()} coins**`
      )
    );

    if (bonus > 0) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `🔥 Bonus streak : **+${bonus.toLocaleString()} coins**`
        )
      );
    }

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `📊 Série : **${streak} jour(s)**\n` +
        `💎 Total gagné : **${total.toLocaleString()} coins**\n` +
        `⏰ Prochain daily : <t:${Math.floor(
          (now + DAILY_COOLDOWN) / 1000
        )}:R>`
      )
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('daily_claim')
        .setLabel('🎁 Daily récupéré')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    container.addActionRowComponents(row);

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};