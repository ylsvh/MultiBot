const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');

const config = require('../../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Signaler un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('Utilisateur à signaler')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Raison du signalement')
        .setRequired(false)
    ),

  async execute(interaction) {

    const target = interaction.options.getUser('utilisateur');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

    const reportChannelId = config.reportChannelId;
    const reportChannel = interaction.guild.channels.cache.get(reportChannelId);

    if (!reportChannel) {
      return interaction.reply({ content: "Salon de signalement non configuré.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('Nouveau signalement')
      .addFields(
        {
          name: 'Utilisateur signalé',
          value: `${target.tag} (${target.id})`,
          inline: true
        },
        {
          name: 'Signalé par',
          value: `${interaction.user.tag} (${interaction.user.id})`,
          inline: true
        },
        {
          name: 'Raison',
          value: reason,
          inline: false
        }
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`report_action_${target.id}`)
        .setLabel('Prendre en charge')
        .setStyle(ButtonStyle.Primary)
    );

    await reportChannel.send({
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({ content: "Signalement envoyé." });
  }
};
