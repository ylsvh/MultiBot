const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const economy = require('../../utils/economy');

module.exports = {
  name: 'rob',
  aliases: ['voler', 'steal'],
  description: 'Tente de voler un membre.',

  async execute(client, message, args) {
        await message.channel.sendTyping();
    const target = message.mentions.users.first();

    if (!target) return message.reply('❌ Mentionne une cible.');
    if (target.id === message.author.id) return message.reply('❌ Impossible.');
    if (target.bot) return message.reply('❌ Bot interdit.');

    const userData = economy.getUserData(message.author.id);
    const targetData = economy.getUserData(target.id);

    if (userData.cash < 100) {
      return message.reply('❌ Minimum 100 coins requis.');
    }

    if (targetData.cash < 50) {
      return message.reply('❌ Cible trop pauvre.');
    }

    const stats = economy.getUserStats(message.author.id);
    const successRate = Math.min(30 + (stats.level * 2), 70);
    const success = Math.random() * 100 < successRate;

    let container = new ContainerBuilder();
    let color = success ? 0x00ff00 : 0xff0000;

    container.setAccentColor(color);

    if (success) {
      const stealPercent = 0.1 + Math.random() * 0.2;
      const amount = Math.min(
        Math.floor(targetData.cash * stealPercent),
        5000
      );

      economy.removeCash(target.id, amount);
      economy.addCash(message.author.id, amount);

      economy.updateStats(message.author.id, 'successfulRobberies', 1);
      economy.updateStats(target.id, 'timesRobbed', 1);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## 💰 Vol réussi\n` +
          `Vous avez volé **${amount.toLocaleString()} coins** à <@${target.id}>`
        )
      );
    } else {
      const loss = Math.floor(userData.cash * 0.1);
      economy.removeCash(message.author.id, loss);

      economy.updateStats(message.author.id, 'failedRobberies', 1);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## 🚔 Vol raté\n` +
          `Vous avez perdu **${loss.toLocaleString()} coins**`
        )
      );
    }

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`rob_again_${message.author.id}`)
          .setLabel('🔁 Réessayer')
          .setStyle(ButtonStyle.Secondary)
      )
    );

    return message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }
};