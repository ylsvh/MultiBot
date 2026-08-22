const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'ticket.sqlite');

const db = new Database(DB_FILE);

db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
        channel_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        category_id TEXT,
        category_name TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        number INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        accepted_by TEXT,
        closed_by TEXT,
        close_reason TEXT,
        closed_at INTEGER,
        transcript_sent INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_guild
    ON tickets(guild_id);

    CREATE INDEX IF NOT EXISTS idx_tickets_user
    ON tickets(user_id);

    CREATE INDEX IF NOT EXISTS idx_tickets_status
    ON tickets(status);

    CREATE INDEX IF NOT EXISTS idx_tickets_guild_user
    ON tickets(guild_id, user_id);
`);

const statements = {
    get: db.prepare(`
        SELECT
            channel_id AS channelId,
            guild_id AS guildId,
            user_id AS userId,
            category_id AS categoryId,
            category_name AS categoryName,
            status,
            number,
            created_at AS createdAt,
            accepted_by AS acceptedBy,
            closed_by AS closedBy,
            close_reason AS closeReason,
            closed_at AS closedAt,
            transcript_sent AS transcriptSent
        FROM tickets
        WHERE channel_id = ?
    `),

    getAll: db.prepare(`
        SELECT
            channel_id AS channelId,
            guild_id AS guildId,
            user_id AS userId,
            category_id AS categoryId,
            category_name AS categoryName,
            status,
            number,
            created_at AS createdAt,
            accepted_by AS acceptedBy,
            closed_by AS closedBy,
            close_reason AS closeReason,
            closed_at AS closedAt,
            transcript_sent AS transcriptSent
        FROM tickets
        ORDER BY number ASC
    `),

    insert: db.prepare(`
        INSERT INTO tickets (
            channel_id,
            guild_id,
            user_id,
            category_id,
            category_name,
            status,
            number,
            created_at,
            accepted_by,
            closed_by,
            close_reason,
            closed_at,
            transcript_sent
        )
        VALUES (
            @channelId,
            @guildId,
            @userId,
            @categoryId,
            @categoryName,
            @status,
            @number,
            @createdAt,
            @acceptedBy,
            @closedBy,
            @closeReason,
            @closedAt,
            @transcriptSent
        )
    `),

    update: db.prepare(`
        UPDATE tickets
        SET
            guild_id = COALESCE(@guildId, guild_id),
            user_id = COALESCE(@userId, user_id),
            category_id = COALESCE(@categoryId, category_id),
            category_name = COALESCE(@categoryName, category_name),
            status = COALESCE(@status, status),
            number = COALESCE(@number, number),
            created_at = COALESCE(@createdAt, created_at),
            accepted_by = CASE
                WHEN @acceptedBy IS NOT NULL THEN @acceptedBy
                ELSE accepted_by
            END,
            closed_by = CASE
                WHEN @closedBy IS NOT NULL THEN @closedBy
                ELSE closed_by
            END,
            close_reason = CASE
                WHEN @closeReason IS NOT NULL THEN @closeReason
                ELSE close_reason
            END,
            closed_at = CASE
                WHEN @closedAt IS NOT NULL THEN @closedAt
                ELSE closed_at
            END,
            transcript_sent = CASE
                WHEN @transcriptSent IS NOT NULL THEN @transcriptSent
                ELSE transcript_sent
            END
        WHERE channel_id = @channelId
    `),

    remove: db.prepare(`
        DELETE FROM tickets
        WHERE channel_id = ?
    `),

    count: db.prepare(`
        SELECT COUNT(*) AS count
        FROM tickets
    `)
};

function normalizeTicket(ticket) {
    if (!ticket) return null;

    return {
        channelId: ticket.channelId ?? null,
        guildId: ticket.guildId ?? null,
        userId: ticket.userId ?? null,
        categoryId: ticket.categoryId ?? null,
        categoryName: ticket.categoryName ?? null,
        status: ticket.status ?? 'open',
        number: ticket.number ?? null,
        createdAt: ticket.createdAt ?? Date.now(),
        acceptedBy: ticket.acceptedBy ?? null,
        closedBy: ticket.closedBy ?? null,
        closeReason: ticket.closeReason ?? null,
        closedAt: ticket.closedAt ?? null,
        transcriptSent: ticket.transcriptSent ? true : false
    };
}

function get(channelId) {
    const ticket = statements.get.get(channelId);

    return ticket || null;
}

function create(channelId, data) {
    const ticket = normalizeTicket({
        ...data,
        channelId
    });

    statements.insert.run({
        channelId: ticket.channelId,
        guildId: ticket.guildId,
        userId: ticket.userId,
        categoryId: ticket.categoryId,
        categoryName: ticket.categoryName,
        status: ticket.status,
        number: ticket.number,
        createdAt: ticket.createdAt,
        acceptedBy: ticket.acceptedBy,
        closedBy: ticket.closedBy,
        closeReason: ticket.closeReason,
        closedAt: ticket.closedAt,
        transcriptSent: ticket.transcriptSent ? 1 : 0
    });

    return get(channelId);
}

function update(channelId, fields) {
    const existing = get(channelId);

    if (!existing) {
        return null;
    }

    const values = {
        channelId,

        guildId:
            Object.prototype.hasOwnProperty.call(fields, 'guildId')
                ? fields.guildId
                : null,

        userId:
            Object.prototype.hasOwnProperty.call(fields, 'userId')
                ? fields.userId
                : null,

        categoryId:
            Object.prototype.hasOwnProperty.call(fields, 'categoryId')
                ? fields.categoryId
                : null,

        categoryName:
            Object.prototype.hasOwnProperty.call(fields, 'categoryName')
                ? fields.categoryName
                : null,

        status:
            Object.prototype.hasOwnProperty.call(fields, 'status')
                ? fields.status
                : null,

        number:
            Object.prototype.hasOwnProperty.call(fields, 'number')
                ? fields.number
                : null,

        createdAt:
            Object.prototype.hasOwnProperty.call(fields, 'createdAt')
                ? fields.createdAt
                : null,

        acceptedBy:
            Object.prototype.hasOwnProperty.call(fields, 'acceptedBy')
                ? fields.acceptedBy
                : null,

        closedBy:
            Object.prototype.hasOwnProperty.call(fields, 'closedBy')
                ? fields.closedBy
                : null,

        closeReason:
            Object.prototype.hasOwnProperty.call(fields, 'closeReason')
                ? fields.closeReason
                : null,

        closedAt:
            Object.prototype.hasOwnProperty.call(fields, 'closedAt')
                ? fields.closedAt
                : null,

        transcriptSent:
            Object.prototype.hasOwnProperty.call(fields, 'transcriptSent')
                ? (fields.transcriptSent ? 1 : 0)
                : null
    };

    statements.update.run(values);

    return get(channelId);
}

function remove(channelId) {
    return statements.remove.run(channelId);
}

function getAll() {
    const rows = statements.getAll.all();

    const result = {};

    for (const ticket of rows) {
        result[ticket.channelId] = {
            channelId: ticket.channelId,
            guildId: ticket.guildId,
            userId: ticket.userId,
            categoryId: ticket.categoryId,
            categoryName: ticket.categoryName,
            status: ticket.status,
            number: ticket.number,
            createdAt: ticket.createdAt,
            acceptedBy: ticket.acceptedBy,
            closedBy: ticket.closedBy,
            closeReason: ticket.closeReason,
            closedAt: ticket.closedAt,
            transcriptSent: Boolean(ticket.transcriptSent)
        };
    }

    return result;
}

function count() {
    return statements.count.get().count;
}

function close() {
    db.close();
}

module.exports = {
    get,
    create,
    update,
    remove,
    getAll,
    count,
    close
};
