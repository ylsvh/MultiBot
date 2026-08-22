const {
  SlashCommandBuilder,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const economy = require('../../utils/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Joue à la machine à sous pour 50 coins.'),

  async execute(interaction, client) {
    const bet = 50;

    const userData = economy.getUserData(interaction.user.id);

    if (userData.cash < bet) {
      return interaction.reply({
        content: '❌ Pas assez de coins.',
        flags: MessageFlags.Ephemeral,
      });
    }

    economy.removeCash(interaction.user.id, bet);

    const symbols = ['🍒', '🍊', '🍇', '🍉', '🍋', '⭐', '💎', '7️⃣'];
    const weights = [30, 25, 20, 15, 8, 1.5, 0.4, 0.1];

    function roll() {
      let r = Math.random() * 100;
      let sum = 0;

      for (let i = 0; i < symbols.length; i++) {
        sum += weights[i];

        if (r <= sum) {
          return symbols[i];
        }
      }

      return symbols[0];
    }

    const s1 = roll();
    const s2 = roll();
    const s3 = roll();

    let winnings = 0;
    let result = '😞 Perdu';

    if (s1 === s2 && s2 === s3) {
      winnings = bet * 10;
      result = '🎰 JACKPOT';
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      winnings = bet * 2;
      result = '💰 2 identiques';
    }

    if (winnings > 0) {
      economy.addCash(interaction.user.id, winnings);
    }

    const container = new ContainerBuilder()
      .setAccentColor(
        winnings > 0 ? 0x00ff00 : 0xff0000
      );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 🎰 Slots\n` +
        `**${s1} | ${s2} | ${s3}**\n\n` +
        `${result}\n\n` +
        `💵 Mise : ${bet}\n` +
        `💰 Gains : ${winnings}`
      )
    );

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`slots_${interaction.user.id}`)
          .setLabel('🔄 Rejouer')
          .setStyle(ButtonStyle.Primary)
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};