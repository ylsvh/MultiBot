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
  name: 'coinflip',
  aliases: ['cf', 'pileface', 'coin'],
  description: 'Joue à pile ou face avec une mise.',
  cooldown: 5,

  async execute(client, message, args) {
        await message.channel.sendTyping();
    const bet = parseInt(args[0]);
    const choice = args[1]?.toLowerCase();

    // ── validations ──
    if (!bet || isNaN(bet) || bet <= 0) {
      return message.reply('❌ Mise invalide.');
    }

    if (!choice || !['pile', 'face', 'p', 'f'].includes(choice)) {
      return message.reply('❌ Choisis pile ou face.');
    }

    const userData = economy.getUserData(message.author.id);

    if (userData.cash < bet) {
      return message.reply(`❌ Pas assez de coins.`);
    }

    if (bet > 10000) {
      return message.reply('❌ Mise max: 10 000 coins.');
    }

    // ── résultat ──
    const result = Math.random() < 0.5 ? 'pile' : 'face';

    const win =
      (choice === 'p' && result === 'pile') ||
      (choice === 'f' && result === 'face') ||
      (choice === result);

    const container = new ContainerBuilder().setAccentColor(win ? 0x00ff00 : 0xff0000);

    // ── titre ──
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 🪙 Coinflip — ${win ? 'Victoire' : 'Défaite'}`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(1)
    );

    // ── résultat ──
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🎯 Résultat : **${result.toUpperCase()}**\n` +
        `🧠 Votre choix : **${choice.toUpperCase()}**\n` +
        `💵 Mise : ${bet.toLocaleString()} coins`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(1)
    );

    if (win) {
      economy.addCash(message.author.id, bet);
      economy.updateStats(message.author.id, 'coinflipWins', 1);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `💰 Gain : **+${bet.toLocaleString()} coins**`
        )
      );
    } else {
      economy.updateStats(message.author.id, 'coinflipLosses', 1);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `💸 Perte : **-${bet.toLocaleString()} coins**`
        )
      );
    }

    const newBalance = economy.getUserData(message.author.id).cash;

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🏦 Nouveau solde : **${newBalance.toLocaleString()} coins**`
      )
    );

    // ── boutons ──
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cf_pile_${bet}_${message.author.id}`)
        .setLabel('🪙 Pile')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`cf_face_${bet}_${message.author.id}`)
        .setLabel('🪙 Face')
        .setStyle(ButtonStyle.Secondary)
    );

    container.addActionRowComponents(row);

    await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};