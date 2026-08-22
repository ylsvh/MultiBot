const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('discord.js');

const economy = require('../../utils/economy');

module.exports = {
  name: 'economy-role-add',
  description: 'Ajoute un bonus économique à un rôle.',

  async execute(client, message, args) {
    await message.channel.sendTyping();

    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Cette commande est réservée aux administrateurs.');
    }

    const role = message.mentions.roles.first();

    if (!role) {
      return message.reply(
        '❌ Utilisation : `+economy-role-add @role 10`'
      );
    }

    const bonus = Number(args[1]);

    if (!Number.isFinite(bonus) || bonus < 0 || bonus > 500) {
      return message.reply(
        '❌ Le bonus doit être compris entre **0 et 500%**.'
      );
    }

    economy.addEconomyRole(
      message.guild.id,
      role.id,
      bonus
    );

    const container = new ContainerBuilder()
      .setAccentColor(0x57F287);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 🎖️ Rôle économique ajouté')
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Rôle :** ${role}\n` +
        `**Bonus :** +${bonus}%\n\n` +
        `Ce bonus s'applique aux récompenses **daily, weekly et monthly**.`
      )
    );

    return message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};