const { 
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
  name: 'balance',
  aliases: ['bal', 'money', 'solde'],
  description: 'Affiche votre solde économique.',
  
  async execute(client, message, args) {
        await message.channel.sendTyping();
    const target = message.mentions.users.first() || message.author;
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
      new SeparatorBuilder().setDivider(true).setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `💵 **Portefeuille :** ${userData.cash.toLocaleString()} coins\n` +
        `🏦 **Banque :** ${userData.bank.toLocaleString()} coins\n` +
        `💎 **Total :** ${stats.total.toLocaleString()} coins`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(1)
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
        .setCustomId('refresh_balance')
        .setLabel('🔄 Actualiser')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('deposit_all')
        .setLabel('📥 Tout déposer')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(userData.cash === 0),

      new ButtonBuilder()
        .setCustomId('withdraw_all')
        .setLabel('📤 Tout retirer')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(userData.bank === 0)
    );

    container.addActionRowComponents(row);

    if (target.id === message.author.id) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Utilisez +balance @user pour voir le solde d'autrui`
        )
      );
    }

    await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};