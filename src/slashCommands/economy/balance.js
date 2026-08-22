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
    .setName('balance')
    .setDescription('Affiche votre solde économique.')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Voir le solde d’un autre utilisateur.')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const target =
      interaction.options.getUser('utilisateur') ||
      interaction.user;

    const userData = economy.getUserData(target.id);
    const stats = economy.getUserStats(target.id);

    const container = new ContainerBuilder()
      .setAccentColor(0x00ff00);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 💰 Solde de ${target.username}`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `💵 **Portefeuille :** ${userData.cash.toLocaleString()} coins\n` +
        `🏦 **Banque :** ${userData.bank.toLocaleString()} coins\n` +
        `💎 **Total :** ${stats.total.toLocaleString()} coins`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `📊 **Statistiques**\n` +
        `• Travaux : ${stats.workCount}\n` +
        `• Daily : ${stats.dailyCount}\n` +
        `• Total gagné : ${stats.totalEarned.toLocaleString()} coins`
      )
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`refresh_balance_${target.id}`)
        .setLabel('🔄 Actualiser')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`deposit_all_${target.id}`)
        .setLabel('📥 Tout déposer')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(
          target.id !== interaction.user.id ||
          userData.cash === 0
        ),

      new ButtonBuilder()
        .setCustomId(`withdraw_all_${target.id}`)
        .setLabel('📤 Tout retirer')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(
          target.id !== interaction.user.id ||
          userData.bank === 0
        )
    );

    container.addActionRowComponents(row);

    if (target.id === interaction.user.id) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Utilisez /balance utilisateur pour voir le solde d'autrui`
        )
      );
    }

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};