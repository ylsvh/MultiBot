const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/reviews.sqlite');

const db = new Database(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
        userId TEXT PRIMARY KEY,
        content TEXT,
        rating INTEGER,
        createdAt INTEGER
    );
`);

module.exports = {
    name: 'interactionCreate',
    once: false,

    async execute(interaction) {

        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith('review_delete_')) return;

        const userId = interaction.customId.split('_')[2];

        if (
            interaction.user.id !== userId &&
            !interaction.member.permissions.has('ManageMessages')
        ) {
            return interaction.reply({
                content: "Tu ne peux pas supprimer cet avis.",
                ephemeral: true
            });
        }

        db.prepare(`
            DELETE FROM reviews
            WHERE userId = ?
        `).run(userId);

        await interaction.message.delete();
    }
};
