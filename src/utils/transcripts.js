const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'transcript.sqlite');

const db = new Database(DB_FILE);

db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS transcripts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        ticket_number INTEGER NOT NULL,
        channel_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,

        category_id TEXT,
        category_name TEXT,

        closed_by TEXT,
        reason TEXT,

        created_at INTEGER NOT NULL,
        closed_at INTEGER NOT NULL,

        messages_count INTEGER NOT NULL DEFAULT 0,

        filename TEXT,
        filepath TEXT,

        sent INTEGER NOT NULL DEFAULT 0,
        discord_message_id TEXT,
        discord_attachment_url TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_transcripts_channel
    ON transcripts(channel_id);

    CREATE INDEX IF NOT EXISTS idx_transcripts_guild
    ON transcripts(guild_id);

    CREATE INDEX IF NOT EXISTS idx_transcripts_user
    ON transcripts(user_id);

    CREATE INDEX IF NOT EXISTS idx_transcripts_ticket
    ON transcripts(ticket_number);
`);

const statements = {
    create: db.prepare(`
        INSERT INTO transcripts (
            ticket_number,
            channel_id,
            guild_id,
            user_id,
            category_id,
            category_name,
            closed_by,
            reason,
            created_at,
            closed_at,
            messages_count,
            filename,
            filepath,
            sent,
            discord_message_id,
            discord_attachment_url
        )
        VALUES (
            @ticketNumber,
            @channelId,
            @guildId,
            @userId,
            @categoryId,
            @categoryName,
            @closedBy,
            @reason,
            @createdAt,
            @closedAt,
            @messagesCount,
            @filename,
            @filepath,
            @sent,
            @discordMessageId,
            @discordAttachmentUrl
        )
    `),

    get: db.prepare(`
        SELECT
            id,
            ticket_number AS ticketNumber,
            channel_id AS channelId,
            guild_id AS guildId,
            user_id AS userId,
            category_id AS categoryId,
            category_name AS categoryName,
            closed_by AS closedBy,
            reason,
            created_at AS createdAt,
            closed_at AS closedAt,
            messages_count AS messagesCount,
            filename,
            filepath,
            sent,
            discord_message_id AS discordMessageId,
            discord_attachment_url AS discordAttachmentUrl
        FROM transcripts
        WHERE id = ?
    `),

    getByChannel: db.prepare(`
        SELECT
            id,
            ticket_number AS ticketNumber,
            channel_id AS channelId,
            guild_id AS guildId,
            user_id AS userId,
            category_id AS categoryId,
            category_name AS categoryName,
            closed_by AS closedBy,
            reason,
            created_at AS createdAt,
            closed_at AS closedAt,
            messages_count AS messagesCount,
            filename,
            filepath,
            sent,
            discord_message_id AS discordMessageId,
            discord_attachment_url AS discordAttachmentUrl
        FROM transcripts
        WHERE channel_id = ?
        ORDER BY id DESC
    `),

    getAll: db.prepare(`
        SELECT
            id,
            ticket_number AS ticketNumber,
            channel_id AS channelId,
            guild_id AS guildId,
            user_id AS userId,
            category_id AS categoryId,
            category_name AS categoryName,
            closed_by AS closedBy,
            reason,
            created_at AS createdAt,
            closed_at AS closedAt,
            messages_count AS messagesCount,
            filename,
            filepath,
            sent,
            discord_message_id AS discordMessageId,
            discord_attachment_url AS discordAttachmentUrl
        FROM transcripts
        ORDER BY id DESC
    `),

    updateSent: db.prepare(`
        UPDATE transcripts
        SET
            sent = 1,
            discord_message_id = @discordMessageId,
            discord_attachment_url = @discordAttachmentUrl
        WHERE id = @id
    `),

    remove: db.prepare(`
        DELETE FROM transcripts
        WHERE id = ?
    `)
};

function create(data) {
    const result = statements.create.run({
        ticketNumber: data.ticketNumber,
        channelId: data.channelId,
        guildId: data.guildId,
        userId: data.userId,

        categoryId:
            data.categoryId ?? null,

        categoryName:
            data.categoryName ?? null,

        closedBy:
            data.closedBy ?? null,

        reason:
            data.reason ?? null,

        createdAt:
            data.createdAt ?? Date.now(),

        closedAt:
            data.closedAt ?? Date.now(),

        messagesCount:
            data.messagesCount ?? 0,

        filename:
            data.filename ?? null,

        filepath:
            data.filepath ?? null,

        sent:
            data.sent ? 1 : 0,

        discordMessageId:
            data.discordMessageId ?? null,

        discordAttachmentUrl:
            data.discordAttachmentUrl ?? null
    });

    return get(result.lastInsertRowid);
}

function get(id) {
    return statements.get.get(id) || null;
}

function getByChannel(channelId) {
    return statements.getByChannel.all(channelId);
}

function getAll() {
    return statements.getAll.all();
}

function markSent(id, discordMessageId, discordAttachmentUrl) {
    statements.updateSent.run({
        id,
        discordMessageId:
            discordMessageId ?? null,
        discordAttachmentUrl:
            discordAttachmentUrl ?? null
    });

    return get(id);
}

function remove(id) {
    return statements.remove.run(id);
}

function close() {
    db.close();
}

module.exports = {
    create,
    get,
    getByChannel,
    getAll,
    markSent,
    remove,
    close
};
