const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('discord.js');

const economy = require('../../utils/economy');

module.exports = {
  name: 'economy-reset',
  description: 'Réinitialise complètement l’économie d’un membre.',

  async execute(client, message) {
    await message.channel.sendTyping();

    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Cette commande est réservée aux administrateurs.');
    }

    const member = message.mentions.members.first();

    if (!member) {
      return message.reply(
        '❌ Utilisation : `+economy-reset @membre`'
      );
    }

    const reset = economy.resetUser(member.id);

    if (!reset) {
      return message.reply(
        '❌ Ce membre ne possède aucune donnée économique.'
      );
    }

    const container = new ContainerBuilder()
      .setAccentColor(0xED4245);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## ♻️ Économie réinitialisée')
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `L'économie de **${member.user.username}** a été entièrement réinitialisée.\n\n` +
        `💵 Portefeuille : **0 coins**\n` +
        `🏦 Banque : **0 coins**\n` +
        `📊 Statistiques : **réinitialisées**`
      )
    );

    return message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};