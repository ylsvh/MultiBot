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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Joue à pile ou face avec une mise.')
    .addIntegerOption(option =>
      option
        .setName('mise')
        .setDescription('Montant de la mise')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10000)
    )
    .addStringOption(option =>
      option
        .setName('choix')
        .setDescription('Choisis pile ou face')
        .setRequired(true)
        .addChoices(
          { name: 'Pile', value: 'pile' },
          { name: 'Face', value: 'face' }
        )
    ),

  cooldown: 5,

  async execute(interaction, client) {
    const bet = interaction.options.getInteger('mise');
    const choice = interaction.options.getString('choix');

    const userData = economy.getUserData(interaction.user.id);

    if (userData.cash < bet) {
      return interaction.reply({
        content: '❌ Pas assez de coins.',
        ephemeral: true
      });
    }

    const result = Math.random() < 0.5 ? 'pile' : 'face';
    const win = choice === result;

    const container = new ContainerBuilder()
      .setAccentColor(win ? 0x00ff00 : 0xff0000);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 🪙 Coinflip — ${win ? 'Victoire' : 'Défaite'}`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🎯 Résultat : **${result.toUpperCase()}**\n` +
        `🧠 Votre choix : **${choice.toUpperCase()}**\n` +
        `💵 Mise : ${bet.toLocaleString()} coins`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1)
    );

    if (win) {
      economy.addCash(interaction.user.id, bet);
      economy.updateStats(
        interaction.user.id,
        'coinflipWins',
        1
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `💰 Gain : **+${bet.toLocaleString()} coins**`
        )
      );
    } else {
      economy.removeCash(interaction.user.id, bet);
      economy.updateStats(
        interaction.user.id,
        'coinflipLosses',
        1
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `💸 Perte : **-${bet.toLocaleString()} coins**`
        )
      );
    }

    const newBalance =
      economy.getUserData(interaction.user.id).cash;

    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🏦 Nouveau solde : **${newBalance.toLocaleString()} coins**`
      )
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(
          `cf_pile_${bet}_${interaction.user.id}`
        )
        .setLabel('🪙 Pile')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(
          `cf_face_${bet}_${interaction.user.id}`
        )
        .setLabel('🪙 Face')
        .setStyle(ButtonStyle.Secondary)
    );

    container.addActionRowComponents(row);

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};