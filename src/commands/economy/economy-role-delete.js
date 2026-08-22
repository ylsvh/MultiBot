const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('discord.js');

const economy = require('../../utils/economy');

module.exports = {
  name: 'economy-role-delete',
  description: 'Supprime un rôle économique.',

  async execute(client, message) {
    await message.channel.sendTyping();

    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Cette commande est réservée aux administrateurs.');
    }

    const role = message.mentions.roles.first();

    if (!role) {
      return message.reply(
        '❌ Utilisation : `+economy-role-delete @role`'
      );
    }

    const removed = economy.removeEconomyRole(
      message.guild.id,
      role.id
    );

    if (!removed) {
      return message.reply(
        `❌ ${role} n'a aucun bonus économique configuré.`
      );
    }

    const container = new ContainerBuilder()
      .setAccentColor(0xED4245);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 🗑️ Rôle économique supprimé')
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `Le bonus économique de ${role} a été supprimé.`
      )
    );

    return message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};