const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const path = require('path');
const Database = require('better-sqlite3');

const REVIEW_CHANNEL_ID = "1540317279370084413";

const dbPath = path.join(__dirname, '../../../data/reviews.sqlite');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    userId TEXT PRIMARY KEY,
    note INTEGER NOT NULL,
    content TEXT NOT NULL,
    date INTEGER NOT NULL
  );
`);

const getReview = db.prepare(`
  SELECT userId, note, content, date
  FROM reviews
  WHERE userId = ?
  LIMIT 1
`);

const insertReview = db.prepare(`
  INSERT INTO reviews (
    userId,
    note,
    content,
    date
  )
  VALUES (?, ?, ?, ?)
`);

const deleteReview = db.prepare(`
  DELETE FROM reviews
  WHERE userId = ?
`);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('review')
    .setDescription('Gestion des avis')

    .addSubcommand(subcommand =>
      subcommand
        .setName('send')
        .setDescription('Envoyer un avis')
        .addIntegerOption(option =>
          option
            .setName('note')
            .setDescription('Note entre 1 et 5')
            .setMinValue(1)
            .setMaxValue(5)
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('commentaire')
            .setDescription('Ton avis')
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Supprimer ton avis')
    ),

  async execute(interaction) {

    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;


    if (subcommand === 'send') {

      const note = interaction.options.getInteger('note');
      const content = interaction.options.getString('commentaire');

      if (!note || note < 1 || note > 5) {
        return interaction.reply({
          content: "La note doit être comprise entre 1 et 5.",
          ephemeral: true
        });
      }

      if (!content || !content.trim()) {
        return interaction.reply({
          content: "Ajoute un commentaire.",
          ephemeral: true
        });
      }

      const existing = getReview.get(userId);

      if (existing) {
        return interaction.reply({
          content: "Tu as déjà envoyé un avis.",
          ephemeral: true
        });
      }

      const channel = interaction.client.channels.cache.get(
        REVIEW_CHANNEL_ID
      );

      if (!channel) {
        return interaction.reply({
          content: "Salon des avis introuvable.",
          ephemeral: true
        });
      }

      try {

        insertReview.run(
          userId,
          content,
          note,
          Date.now()
        );

        const stars =
          "⭐".repeat(note) +
          "☆".repeat(5 - note);

        const embed = new EmbedBuilder()
          .setColor('#2b2d31')
          .setTitle(`Nouvel avis de ${interaction.user.username}`)
          .setDescription("Cet avis est subjectif et reflète l'expérience personnelle de son auteur.")
          .addFields(
            {
              name: "Note :",
              value: `${stars} (${note}/5)`
            },
            {
              name: "Commentaire :",
              value: `\`\`\`yaml\n${content}\n\`\`\``
            }
          )
          .setThumbnail(
            interaction.user.displayAvatarURL({
              dynamic: true
            })
          )
          .setFooter({
            text: `ID: ${interaction.user.id}`
          })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`review_delete_${userId}`)
            .setLabel('Supprimer')
            .setStyle(ButtonStyle.Danger)
        );

        try {

          await channel.send({
            embeds: [embed],
            components: [row]
          });

        } catch (error) {

          deleteReview.run(userId);

          console.error(
            "[REVIEW] Impossible d'envoyer l'avis :",
            error
          );

          return interaction.reply({
            content: "Impossible d'envoyer l'avis.",
            ephemeral: true
          });
        }

        return interaction.reply({
          content: "Avis envoyé.",
          ephemeral: true
        });

      } catch (error) {

        console.error(
          "[REVIEW] Impossible d'enregistrer l'avis :",
          error
        );

        return interaction.reply({
          content: "Impossible d'enregistrer ton avis.",
          ephemeral: true
        });
      }
    }


    if (subcommand === 'delete') {

      const review = getReview.get(userId);

      if (!review) {
        return interaction.reply({
          content: "Tu n'as aucun avis à supprimer.",
          ephemeral: true
        });
      }

      try {

        deleteReview.run(userId);

        const channel = interaction.client.channels.cache.get(
          REVIEW_CHANNEL_ID
        );

        if (channel) {

          const messages = await channel.messages.fetch({
            limit: 100
          });

          const reviewMessage = messages.find(message => {

            if (message.author.id !== interaction.client.user.id) {
              return false;
            }

            return message.components?.some(row =>
              row.components?.some(component =>
                component.customId === `review_delete_${userId}`
              )
            );
          });

          if (reviewMessage) {
            await reviewMessage.delete().catch(() => {});
          }
        }

        return interaction.reply({
          content: "Ton avis a été supprimé.",
          ephemeral: true
        });

      } catch (error) {

        console.error(
          "[REVIEW] Impossible de supprimer l'avis :",
          error
        );

        return interaction.reply({
          content: "Impossible de supprimer ton avis.",
          ephemeral: true
        });
      }
    }
  }
};
