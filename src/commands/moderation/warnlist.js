const fs = require('fs');
const path = require('path');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');

const warningsFilePath = path.join(__dirname, '../../../data/warnings.json');

module.exports = {
  name: 'warnlist',
  description: "Affiche les warnings d'un utilisateur",

  async execute(client, message, args) {
    const member = message.mentions.members.first();

    if (!member) {
      return message.reply('❌ Veuillez mentionner un membre.');
    }

    if (!fs.existsSync(warningsFilePath)) {
      return message.reply('❌ Aucun avertissement enregistré.');
    }

    let warnings;

    try {
      warnings = JSON.parse(fs.readFileSync(warningsFilePath, 'utf8'));
    } catch {
      return message.reply('❌ Impossible de lire les avertissements.');
    }

    const guildId = message.guild.id;
    const userWarnings = warnings[guildId]?.[member.id];

    if (!userWarnings || userWarnings.length === 0) {
      return message.reply(`✅ ${member.user.tag} n'a aucun avertissement sur ce serveur.`);
    }

    const pages = [];
    const warningsPerPage = 5;

    for (let i = 0; i < userWarnings.length; i += warningsPerPage) {
      pages.push(userWarnings.slice(i, i + warningsPerPage));
    }

    let page = 0;

    function createContainer() {
      const container = new ContainerBuilder();

      let content = `# ⚠️ Warnings de ${member.user.tag}\n`;
      content += `Total : **${userWarnings.length}** avertissement(s)\n`;
      content += `Page **${page + 1}/${pages.length}**\n\n`;

      pages[page].forEach((warn, index) => {
        const number = page * warningsPerPage + index + 1;
        const date = new Date(warn.timestamp).toLocaleString('fr-FR');

        content += `**${number}. ${warn.reason}**\n`;
        content += `👮 Modérateur : ${warn.moderator}\n`;
        content += `📅 Date : ${date}\n\n`;
      });

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content)
      );

      if (pages.length > 1) {
        container.addSeparatorComponents(
          new SeparatorBuilder()
        );
      }

      return container;
    }

    function createButtons() {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('warnlist_prev')
          .setLabel('◀️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),

        new ButtonBuilder()
          .setCustomId('warnlist_page')
          .setLabel(`${page + 1}/${pages.length}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),

        new ButtonBuilder()
          .setCustomId('warnlist_next')
          .setLabel('▶️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === pages.length - 1)
      );
    }

    const components = [createContainer()];

    if (pages.length > 1) {
      components.push(createButtons());
    }

    const reply = await message.reply({
      components,
      flags: MessageFlags.IsComponentsV2
    });

    if (pages.length <= 1) return;

    const collector = reply.createMessageComponentCollector({
      time: 120000
    });

    collector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: "❌ Vous ne pouvez pas utiliser ces boutons.",
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId === 'warnlist_prev') {
        page--;
      }

      if (interaction.customId === 'warnlist_next') {
        page++;
      }

      await interaction.update({
        components: [
          createContainer(),
          createButtons()
        ],
        flags: MessageFlags.IsComponentsV2
      });
    });

    collector.on('end', async () => {
      try {
        await reply.edit({
          components: [
            createContainer()
          ],
          flags: MessageFlags.IsComponentsV2
        });
      } catch {}
    });
  }
};
