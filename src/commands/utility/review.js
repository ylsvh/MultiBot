const {
  SlashCommandBuilder,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bugreport')
    .setDescription('Signale un bug au owner')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Description du bug')
        .setRequired(true)
    ),

  async execute(interaction) {

    const report = interaction.options.getString('message');
    const ownerId = '1200909869872586752';

    try {
      const user = await interaction.client.users.fetch(ownerId);

      const container = new ContainerBuilder().setAccentColor(0xED4245);

      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `Bug report de ${interaction.user.tag} (${interaction.user.id})`
            )
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL(
              interaction.user.displayAvatarURL({ size: 64 })
            )
          )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(1).setDivider(true)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(report)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `<t:${Math.floor(Date.now() / 1000)}:f>`
        )
      );

      await user.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

      return interaction.reply({ content: "Bug report envoyé." });

    } catch (e) {
      return interaction.reply({ content: "Impossible d'envoyer le bug report.", ephemeral: true });
    }
  }
};
