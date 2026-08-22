const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const REVIEW_CHANNEL_ID = "1540317279370084413";


const dbPath = path.join(__dirname, '../../../data/reviews.sqlite');

const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (fs.existsSync(dbPath)) {
  try {
    fs.rmSync(dbPath, { force: true });
    console.log('[REVIEW] Ancienne reviews.sqlite supprimée.');
  } catch (error) {
    console.error(
      '[REVIEW] Impossible de supprimer reviews.sqlite :',
      error
    );
  }
}

const db = new Database(dbPath);

console.log('[REVIEW] Nouvelle reviews.sqlite créée.');

db.exec(`
  CREATE TABLE reviews (
    userId TEXT PRIMARY KEY,
    note INTEGER NOT NULL,
    content TEXT NOT NULL,
    date INTEGER NOT NULL
  );
`);

console.log('[REVIEW] Table reviews créée.');


module.exports = {
  name: 'review',

  async execute(client, message, args) {

    const subcommand = args[0]?.toLowerCase();


    if (subcommand === 'delete') {

      const userId = message.author.id;

      const review = db.prepare(`
        SELECT userId
        FROM reviews
        WHERE userId = ?
      `).get(userId);

      if (!review) {
        return message.reply(
          "Tu n'as aucun avis à supprimer."
        );
      }

      db.prepare(`
        DELETE FROM reviews
        WHERE userId = ?
      `).run(userId);

      const channel = client.channels.cache.get(
        REVIEW_CHANNEL_ID
      );

      if (channel) {

        try {

          const messages = await channel.messages.fetch({
            limit: 100
          });

          const reviewMessage = messages.find(msg =>
            msg.author.id === client.user.id &&
            msg.components?.some(row =>
              row.components?.some(component =>
                component.customId === `review_delete_${userId}`
              )
            )
          );

          if (reviewMessage) {
            await reviewMessage.delete().catch(() => {});
          }

        } catch (error) {

          console.error(
            '[REVIEW] Impossible de supprimer le message de l\'avis :',
            error
          );
        }
      }

      return message.reply(
        "Ton avis a été supprimé."
      );
    }


    const note = parseInt(args[0]);
    const content = args.slice(1).join(" ");

    if (!note || note < 1 || note > 5) {
      return message.reply(
        "Utilisation : `review <note> <commentaire>` ou `review delete`."
      );
    }

    if (!content) {
      return message.reply(
        "Ajoute un commentaire."
      );
    }

    const userId = message.author.id;

    const existing = db.prepare(`
      SELECT userId
      FROM reviews
      WHERE userId = ?
    `).get(userId);

    if (existing) {
      return message.reply(
        "Tu as déjà envoyé un avis."
      );
    }

    try {

      db.prepare(`
        INSERT INTO reviews (
          userId,
          note,
          content,
          date
        )
        VALUES (?, ?, ?, ?)
      `).run(
        userId,
        note,
        content,
        Date.now()
      );

    } catch (error) {

      console.error(
        '[REVIEW] Impossible d\'enregistrer l\'avis :',
        error
      );

      return message.reply(
        "Impossible d'enregistrer ton avis."
      );
    }

    const stars =
      "⭐".repeat(note) +
      "☆".repeat(5 - note);

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle(
        `Nouvel avis de ${message.author.username}`
      )
      .setDescription(
        "Cet avis est subjectif et reflète l'expérience personnelle de son auteur."
      )
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
        message.author.displayAvatarURL({
          dynamic: true
        })
      )
      .setFooter({
        text: `ID: ${message.author.id}`
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`review_delete_${userId}`)
        .setLabel('Supprimer')
        .setStyle(ButtonStyle.Danger)
    );

    const channel = client.channels.cache.get(
      REVIEW_CHANNEL_ID
    );

    if (!channel) {
      db.prepare(`
        DELETE FROM reviews
        WHERE userId = ?
      `).run(userId);

      return message.reply(
        "Salon introuvable."
      );
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
        "[REVIEW] Impossible d'envoyer l'avis :",
        error
      );

      return message.reply(
        "Impossible d'envoyer l'avis."
      );
    }

    return message.reply(
      "Avis envoyé."
    );
  }
};
