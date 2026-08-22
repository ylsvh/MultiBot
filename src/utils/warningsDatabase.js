const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'warnings.sqlite');
const JSON_FILE = path.join(DATA_DIR, 'warnings.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_FILE);

db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        reason TEXT,
        created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS warn_permissions (
        guild_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        PRIMARY KEY (guild_id, role_id)
    );

    CREATE INDEX IF NOT EXISTS idx_warnings_guild_user
    ON warnings(guild_id, user_id);

    CREATE INDEX IF NOT EXISTS idx_warnings_guild
    ON warnings(guild_id);
`);

const statements = {
    get: db.prepare(`
        SELECT
            id,
            guild_id AS guildId,
            user_id AS userId,
            moderator_id AS moderatorId,
            reason,
            created_at AS createdAt
        FROM warnings
        WHERE id = ?
    `),

    getUserWarnings: db.prepare(`
        SELECT
            id,
            guild_id AS guildId,
            user_id AS userId,
            moderator_id AS moderatorId,
            reason,
            created_at AS createdAt
        FROM warnings
        WHERE guild_id = ?
        AND user_id = ?
        ORDER BY id ASC
    `),

    create: db.prepare(`
        INSERT INTO warnings (
            guild_id,
            user_id,
            moderator_id,
            reason,
            created_at
        )
        VALUES (?, ?, ?, ?, ?)
    `),

    remove: db.prepare(`
        DELETE FROM warnings
        WHERE id = ?
        AND guild_id = ?
    `),

    clearUser: db.prepare(`
        DELETE FROM warnings
        WHERE guild_id = ?
        AND user_id = ?
    `),

    countUser: db.prepare(`
        SELECT COUNT(*) AS count
        FROM warnings
        WHERE guild_id = ?
        AND user_id = ?
    `),

    countAll: db.prepare(`
        SELECT COUNT(*) AS count
        FROM warnings
    `),

    getPermission: db.prepare(`
        SELECT role_id AS roleId
        FROM warn_permissions
        WHERE guild_id = ?
        AND role_id = ?
    `),

    getPermissions: db.prepare(`
        SELECT role_id AS roleId
        FROM warn_permissions
        WHERE guild_id = ?
        ORDER BY role_id ASC
    `),

    addPermission: db.prepare(`
        INSERT OR IGNORE INTO warn_permissions (
            guild_id,
            role_id
        )
        VALUES (?, ?)
    `),

    removePermission: db.prepare(`
        DELETE FROM warn_permissions
        WHERE guild_id = ?
        AND role_id = ?
    `)
};

function get(id) {
    return statements.get.get(id) || null;
}

function create(guildId, userId, moderatorId, reason) {
    const result = statements.create.run(
        guildId,
        userId,
        moderatorId,
        reason || null,
        Date.now()
    );

    return get(result.lastInsertRowid);
}

function getUserWarnings(guildId, userId) {
    return statements.getUserWarnings.all(
        guildId,
        userId
    );
}

function remove(id, guildId) {
    return statements.remove.run(
        id,
        guildId
    );
}

function clearUser(guildId, userId) {
    return statements.clearUser.run(
        guildId,
        userId
    );
}

function countUserWarnings(guildId, userId) {
    return statements.countUser.get(
        guildId,
        userId
    ).count;
}

function hasPermission(guildId, roleId) {
    return Boolean(
        statements.getPermission.get(
            guildId,
            roleId
        )
    );
}

function getPermissions(guildId) {
    return statements.getPermissions
        .all(guildId)
        .map(permission => permission.roleId);
}

function addPermission(guildId, roleId) {
    return statements.addPermission.run(
        guildId,
        roleId
    );
}

function removePermission(guildId, roleId) {
    return statements.removePermission.run(
        guildId,
        roleId
    );
}

function togglePermission(guildId, roleId) {
    if (hasPermission(guildId, roleId)) {
        removePermission(guildId, roleId);
        return false;
    }

    addPermission(guildId, roleId);
    return true;
}

function migrateJsonWarnings() {
    if (!fs.existsSync(JSON_FILE)) {
        return;
    }

    let data;

    try {
        data = JSON.parse(
            fs.readFileSync(JSON_FILE, 'utf8')
        );
    } catch (error) {
        console.error(
            '[WARNINGS DATABASE] Impossible de lire warnings.json :',
            error
        );
        return;
    }

    if (!data || typeof data !== 'object') {
        return;
    }

    const totalBefore = statements.countAll.get().count;

    if (totalBefore > 0) {
        return;
    }

    const transaction = db.transaction(() => {
        let imported = 0;

        for (const [guildId, users] of Object.entries(data)) {
            if (!users || typeof users !== 'object') {
                continue;
            }

            for (const [userId, warnings] of Object.entries(users)) {
                if (!Array.isArray(warnings)) {
                    continue;
                }

                for (const warning of warnings) {
                    if (!warning || typeof warning !== 'object') {
                        continue;
                    }

                    const reason =
                        typeof warning.reason === 'string' &&
                        warning.reason.trim().length > 0
                            ? warning.reason.trim()
                            : null;

                    const moderatorId =
                        warning.moderator ||
                        warning.moderatorId ||
                        'Inconnu';

                    const createdAt =
                        Number.isFinite(warning.timestamp)
                            ? warning.timestamp
                            : Date.now();

                    statements.create.run(
                        guildId,
                        userId,
                        moderatorId,
                        reason,
                        createdAt
                    );

                    imported++;
                }
            }
        }

        return imported;
    });

    try {
        const imported = transaction();

        console.log(
            `[WARNINGS DATABASE] Migration terminée : ${imported} warning(s) importé(s) depuis warnings.json.`
        );
    } catch (error) {
        console.error(
            '[WARNINGS DATABASE] Erreur pendant la migration :',
            error
        );
    }
}

migrateJsonWarnings();

function close() {
    db.close();
}

module.exports = {
    get,
    create,
    getUserWarnings,
    remove,
    clearUser,
    countUserWarnings,
    hasPermission,
    getPermissions,
    addPermission,
    removePermission,
    togglePermission,
    close
};
