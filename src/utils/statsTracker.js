const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "../../data");
const sqliteFile = path.join(dataDir, "stats.sqlite");
const jsonFile = path.join(dataDir, "stats.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(sqliteFile);

db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guildId TEXT NOT NULL,
        userId TEXT NOT NULL,
        channelId TEXT NOT NULL,
        timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS voice (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guildId TEXT NOT NULL,
        userId TEXT NOT NULL,
        channelId TEXT NOT NULL,
        startedAt INTEGER NOT NULL,
        endedAt INTEGER NOT NULL,
        duration INTEGER NOT NULL
    );
`);

function migrateJson() {
    if (!fs.existsSync(jsonFile)) return;

    try {
        const data = JSON.parse(fs.readFileSync(jsonFile, "utf8"));

        const count = db.prepare(
            "SELECT COUNT(*) as count FROM messages"
        ).get().count;

        if (count > 0) return;

        const insertMessage = db.prepare(`
            INSERT INTO messages (
                guildId,
                userId,
                channelId,
                timestamp
            )
            VALUES (?, ?, ?, ?)
        `);

        const insertVoice = db.prepare(`
            INSERT INTO voice (
                guildId,
                userId,
                channelId,
                startedAt,
                endedAt,
                duration
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction(() => {
            for (const guildId in data) {

                const guild = data[guildId];

                if (Array.isArray(guild.messages)) {
                    for (const msg of guild.messages) {
                        insertMessage.run(
                            guildId,
                            msg.userId,
                            msg.channelId,
                            msg.timestamp
                        );
                    }
                }

                if (Array.isArray(guild.voice)) {
                    for (const voice of guild.voice) {
                        insertVoice.run(
                            guildId,
                            voice.userId,
                            voice.channelId,
                            voice.startedAt,
                            voice.endedAt,
                            voice.duration
                        );
                    }
                }
            }
        });

        transaction();

        fs.renameSync(
            jsonFile,
            jsonFile + ".backup"
        );

        console.log("[STATS] Migration stats.json -> SQLite terminée");

    } catch (err) {
        console.error("[STATS] Erreur migration JSON :", err);
    }
}

migrateJson();


function addMessage(message) {
    if (!message.guild || !message.author || message.author.bot) {
        return;
    }

    db.prepare(`
        INSERT INTO messages (
            guildId,
            userId,
            channelId,
            timestamp
        )
        VALUES (?, ?, ?, ?)
    `).run(
        message.guild.id,
        message.author.id,
        message.channel.id,
        Date.now()
    );

    cleanup(message.guild.id);
}


function addVoiceSession({
    guildId,
    userId,
    channelId,
    startedAt,
    endedAt
}) {
    if (!guildId || !userId || !channelId || !startedAt || !endedAt) {
        return;
    }

    const duration = endedAt - startedAt;

    if (duration <= 0) {
        return;
    }

    db.prepare(`
        INSERT INTO voice (
            guildId,
            userId,
            channelId,
            startedAt,
            endedAt,
            duration
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        guildId,
        userId,
        channelId,
        startedAt,
        endedAt,
        duration
    );

    cleanup(guildId);
}


function cleanup(guildId) {
    const limit = Date.now() - (
        14 * 24 * 60 * 60 * 1000
    );

    db.prepare(`
        DELETE FROM messages
        WHERE guildId = ?
        AND timestamp < ?
    `).run(
        guildId,
        limit
    );

    db.prepare(`
        DELETE FROM voice
        WHERE guildId = ?
        AND endedAt < ?
    `).run(
        guildId,
        limit
    );
}


function getStats(guildId, days) {
    cleanup(guildId);

    const since = Date.now() - (
        days * 24 * 60 * 60 * 1000
    );

    return {
        messages: db.prepare(`
            SELECT
                userId,
                channelId,
                timestamp
            FROM messages
            WHERE guildId = ?
            AND timestamp >= ?
        `).all(
            guildId,
            since
        ),

        voice: db.prepare(`
            SELECT
                userId,
                channelId,
                startedAt,
                endedAt,
                duration
            FROM voice
            WHERE guildId = ?
            AND endedAt >= ?
        `).all(
            guildId,
            since
        )
    };
}


module.exports = {
    addMessage,
    addVoiceSession,
    getStats,
    cleanup
};
