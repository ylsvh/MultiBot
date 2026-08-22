const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const REVIEW_CHANNEL_ID = "1495351088126361611";
const DATA_PATH = path.join(__dirname, '../../../data/reviews.json');
const DATABASE_PATH = path.join(__dirname, '../../../data/reviews.sqlite');

const db = new Database(DATABASE_PATH);

function migrateReviews() {
  if (!fs.existsSync(DATA_PATH)) return;

  let data;

  try {
    data = JSON.parse(
      fs.readFileSync(DATA_PATH, 'utf8') || '{}'
    );
  } catch (error) {
    console.error(
      'Impossible de lire reviews.json :',
      error
    );
    return;
  }

  const insertReview = db.prepare(`
    INSERT OR IGNORE INTO reviews (
      userId,
      content,
      rating,
      createdAt
    )
    VALUES (?, ?, ?, ?)
  `);

  const migrate = db.transaction(() => {
    for (const [userId, review] of Object.entries(data)) {
      if (!review || typeof review !== 'object') {
        continue;
      }

      const rating = Number(
        review.rating ?? review.note
      );

      const content = String(
        review.content ?? review.commentaire ?? ''
      );

      const createdAt = Number(
        review.createdAt ?? review.date
      ) || Date.now();

      if (
        !userId ||
        !content ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        continue;
      }

      insertReview.run(
        userId,
        content,
        rating,
        createdAt
      );
    }
  });

  try {
    migrate();
    fs.unlinkSync(DATA_PATH);
  } catch (error) {
    console.error(
      'Impossible de terminer la migration de reviews.json :',
      error
    );
  }
}

migrateReviews();

const getReview = db.prepare(`
  SELECT userId
  FROM reviews
  WHERE userId = ?
  LIMIT 1
`);

const insertReview = db.prepare(`
  INSERT INTO reviews (
    userId,
    content,
    rating,
    createdAt
  )
  VALUES (?, ?, ?, ?)
`);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('review')
    .setDescription('Envoyer un avis')
    .addIntegerOption(option =>
      option
        .setName('note')
        .setDescription('Note entre 1 et 5')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('commentaire')
        .setDescription('Ton avis')
        .setRequired(true)
    ),

  async execute(interaction) {
    const note = interaction.options.getInteger('note');
    const content = interaction.options.getString('commentaire');

    if (!note || note < 1 || note > 5) {
      return interaction.reply({
        content: "Note entre 1 et 5.",
        ephemeral: true
      });
    }

    if (!content) {
      return interaction.reply({
        content: "Ajoute un commentaire.",
        ephemeral: true
      });
    }

    const userId = interaction.user.id;

    if (getReview.get(userId)) {
      return interaction.reply({
        content: "Tu as déjà envoyé un avis.",
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
    } catch (error) {
      console.error(
        "Impossible d'enregistrer l'avis :",
        error
      );

      return interaction.reply({
        content: "Impossible d'enregistrer ton avis.",
        ephemeral: true
      });
    }

    const stars =
      "⭐".repeat(note) +
      "☆".repeat(5 - note);

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle(`Nouvel avis de ${interaction.user.username}`)
      .setDescription("Cet avis est subjectif.")
      .addFields(
        {
          name: "Note",
          value: `${stars} (${note}/5)`
        },
        {
          name: "Commentaire",
          value: `\`\`\`${content}\`\`\``
        }
      )
      .setThumbnail(
        interaction.user.displayAvatarURL()
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

    const channel =
      interaction.client.channels.cache.get(
        REVIEW_CHANNEL_ID
      );

    if (!channel) {
      db.prepare(`
        DELETE FROM reviews
        WHERE userId = ?
      `).run(userId);

      return interaction.reply({
        content: "Salon introuvable.",
        ephemeral: true
      });
    }

    try {
      await channel.send({
        embeds: [embed],
        components: [row]
      });
    } catch (error) {
      db.prepare(`
        DELETE FROM reviews
        WHERE userId = ?
      `).run(userId);

      console.error(
        "Impossible d'envoyer l'avis :",
        error
      );

      return interaction.reply({
        content: "Impossible d'envoyer l'avis.",
        ephemeral: true
      });
    }

    return interaction.reply({
      content: "Avis envoyé."
    });
  }
};