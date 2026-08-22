const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
} = require('discord.js');

const economy = require('../../utils/economy');

module.exports = {
  name: 'pay',

  async execute(client, message, args) {
        await message.channel.sendTyping();
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target || !amount) {
      return message.reply('❌ Usage incorrect.');
    }

    const user = economy.getUserData(message.author.id);

    if (user.cash < amount) {
      return message.reply('❌ Pas assez.');
    }

    economy.transfer(message.author.id, target.id, amount);

    const container = new ContainerBuilder()
      .setAccentColor(0x00ff00);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 💸 Transfert\n<@${message.author.id}> → <@${target.id}>\n+${amount}`
      )
    );

    return message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }
};