const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('discord.js');

const economy = require('../../utils/economy');

module.exports = {
  name: 'economy-greset',
  description: 'Réinitialise l’économie de tous les membres du serveur.',

  async execute(client, message) {
    await message.channel.sendTyping();

    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Cette commande est réservée aux administrateurs.');
    }

    const data = economy.loadData();
    let count = 0;

    for (const member of message.guild.members.cache.values()) {
      if (!data[member.id]) continue;

      economy.resetUser(member.id);
      count++;
    }

    const container = new ContainerBuilder()
      .setAccentColor(0xED4245);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## ⚠️ Économie du serveur réinitialisée')
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `L'économie de **${count} membre(s)** a été réinitialisée.\n\n` +
        `💵 Portefeuilles : **0 coins**\n` +
        `🏦 Banques : **0 coins**\n` +
        `📊 Statistiques : **réinitialisées**`
      )
    );

    return message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};