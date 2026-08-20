const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('discord.js');

const economy = require('../../utils/economy');

module.exports = {
  name: 'deposit',
  aliases: ['dep', 'deposer'],
  description: 'Dépose de l\'argent dans la banque.',

  async execute(client, message, args) {
        await message.channel.sendTyping();
    const amount = parseInt(args[0]);

    if (!amount || isNaN(amount) || amount <= 0) {
      return message.reply('❌ Montant invalide.');
    }

    const userData = economy.getUserData(message.author.id);

    if (userData.cash < amount) {
      return message.reply(`❌ Pas assez de coins.`);
    }

    const success = economy.deposit(message.author.id, amount);

    if (!success) {
      return message.reply('❌ Erreur lors du dépôt.');
    }

    const newData = economy.getUserData(message.author.id);

    const container = new ContainerBuilder()
      .setAccentColor(0x00ff00);

    // ── title ──
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 🏦 Dépôt effectué`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true)
    );

    // ── infos ──
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `💵 Déposé : **${amount.toLocaleString()} coins**\n` +
        `💰 Poche : **${newData.cash.toLocaleString()} coins**\n` +
        `🏦 Banque : **${newData.bank.toLocaleString()} coins**`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `✅ Transaction réussie`
      )
    );

    await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    console.log(`[ECONOMY] ${message.author.username} a déposé ${amount} coins`);
  }
};