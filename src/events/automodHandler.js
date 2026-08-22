const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const {
    getAutomod,
    isWhitelisted
} = require('../utils/automodConfig');

const warningsFile = path.join(
    __dirname,
    '../../data/warnings.json'
);

const databaseFile = path.join(
    __dirname,
    '../../data/automodWarns.sqlite'
);

const db = new Database(databaseFile);

db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        moderator TEXT NOT NULL,
        timestamp INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_warnings_guild_user
    ON warnings (guild_id, user_id);
`);

function migrateWarnings() {
    if (!fs.existsSync(warningsFile)) return;

    let data;

    try {
        data = JSON.parse(
            fs.readFileSync(warningsFile, 'utf8')
        );
    } catch {
        return;
    }

    const insert = db.prepare(`
        INSERT INTO warnings (
            guild_id,
            user_id,
            reason,
            moderator,
            timestamp
        )
        SELECT ?, ?, ?, ?, ?
        WHERE NOT EXISTS (
            SELECT 1
            FROM warnings
            WHERE guild_id = ?
            AND user_id = ?
            AND reason = ?
            AND moderator = ?
            AND timestamp = ?
        )
    `);

    const migrate = db.transaction(() => {
        for (const [guildId, users] of Object.entries(data || {})) {
            if (!users || typeof users !== 'object') continue;

            for (const [userId, warnings] of Object.entries(users)) {
                if (!Array.isArray(warnings)) continue;

                for (const warning of warnings) {
                    if (!warning || typeof warning !== 'object') continue;

                    const reason =
                        String(warning.reason || 'Aucune raison');

                    const moderator =
                        String(warning.moderator || 'AutoMod');

                    const timestamp =
                        Number(warning.timestamp) || Date.now();

                    insert.run(
                        guildId,
                        userId,
                        reason,
                        moderator,
                        timestamp,
                        guildId,
                        userId,
                        reason,
                        moderator,
                        timestamp
                    );
                }
            }
        }
    });

    try {
        migrate();
        fs.unlinkSync(warningsFile);
    } catch {}
}

migrateWarnings();

const insertWarning = db.prepare(`
    INSERT INTO warnings (
        guild_id,
        user_id,
        reason,
        moderator,
        timestamp
    )
    VALUES (?, ?, ?, ?, ?)
`);

function addWarning(guildId, userId, reason) {
    try {
        insertWarning.run(
            guildId,
            userId,
            reason,
            'AutoMod',
            Date.now()
        );
    } catch {}
}

const spamCache = new Map();
const mentionCache = new Map();

const INVITE_REGEX =
    /(?:https?:\/\/)?(?:www\.)?(?:discord(?:app)?\.(?:gg|com\/invite)\/[a-zA-Z0-9-]+)/i;

const URL_REGEX =
    /(?:https?:\/\/|www\.)[^\s<>\"]{2,}/i;

async function takeAction(message, module, moduleName, reason) {
    const action = module.action;
    const member = message.member;
    const guild = message.guild;

    try {
        await message.delete();
    } catch {}

    if (!member) return;

    if (action === 'warn') {
        addWarning(
            guild.id,
            member.id,
            `AutoMod (${moduleName}) : ${reason}`
        );

        try {
            await member.send(
                `⚠️ Vous avez été averti sur **${guild.name}**.\n` +
                `**Raison :** ${reason}`
            );
        } catch {}

        return;
    }

    if (action === 'mute') {
        if (!member.moderatable) return;

        try {
            await member.timeout(
                10 * 60 * 1000,
                `AutoMod : ${reason}`
            );

            try {
                await member.send(
                    `🔇 Vous avez été muté pendant 10 minutes sur **${guild.name}**.\n` +
                    `**Raison :** ${reason}`
                );
            } catch {}
        } catch {}

        return;
    }

    if (action === 'kick') {
        if (!member.kickable) return;

        try {
            await member.send(
                `👢 Vous avez été expulsé de **${guild.name}**.\n` +
                `**Raison :** ${reason}`
            );
        } catch {}

        try {
            await member.kick(
                `AutoMod : ${reason}`
            );
        } catch {}

        return;
    }

    if (action === 'ban') {
        if (!member.bannable) return;

        try {
            await member.send(
                `🔨 Vous avez été banni de **${guild.name}**.\n` +
                `**Raison :** ${reason}`
            );
        } catch {}

        try {
            await guild.members.ban(
                member.id,
                {
                    reason: `AutoMod : ${reason}`,
                    deleteMessageSeconds: 60
                }
            );
        } catch {}
    }
}

function checkSpam(message, module) {
    const key = `${message.guild.id}:${message.author.id}`;

    let data = spamCache.get(key);

    if (!data) {
        data = {
            messages: [],
            lastContent: null,
            duplicates: 0
        };

        spamCache.set(key, data);
    }

    const now = Date.now();

    data.messages = data.messages.filter(
        timestamp => now - timestamp <= module.interval
    );

    data.messages.push(now);

    if (data.lastContent === message.content) {
        data.duplicates++;
    } else {
        data.duplicates = 1;
        data.lastContent = message.content;
    }

    if (
        data.messages.length >= module.maxMessages
    ) {
        spamCache.delete(key);

        return 'Envoi massif de messages détecté';
    }

    if (
        data.duplicates >= module.duplicateLimit
    ) {
        spamCache.delete(key);

        return 'Messages identiques répétés';
    }

    setTimeout(() => {
        const current = spamCache.get(key);

        if (current) {
            current.messages = current.messages.filter(
                timestamp =>
                    Date.now() - timestamp <= module.interval
            );

            if (!current.messages.length) {
                spamCache.delete(key);
            }
        }
    }, module.interval + 100);

    return null;
}

function checkMentions(message, module) {
    const users = message.mentions.users.size;
    const roles = message.mentions.roles.size;
    const total = users + roles;

    if (message.mentions.everyone) {
        return 'Mention @everyone/@here détectée';
    }

    if (users >= module.maxUsers) {
        return `Trop de membres mentionnés (${users})`;
    }

    if (roles >= module.maxRoles) {
        return `Trop de rôles mentionnés (${roles})`;
    }

    if (total >= module.maxTotal) {
        return `Trop de mentions (${total})`;
    }

    if (message.mentions.users.size === 0) {
        return null;
    }

    const now = Date.now();

    for (const userId of message.mentions.users.keys()) {
        const key =
            `${message.guild.id}:${message.author.id}:${userId}`;

        let timestamps =
            mentionCache.get(key) || [];

        timestamps = timestamps.filter(
            timestamp =>
                now - timestamp <= module.repeatInterval
        );

        timestamps.push(now);

        mentionCache.set(key, timestamps);

        if (timestamps.length >= module.repeatLimit) {
            mentionCache.delete(key);

            return `Spam de mentions vers <@${userId}>`;
        }

        setTimeout(() => {
            const current = mentionCache.get(key);

            if (!current) return;

            const filtered = current.filter(
                timestamp =>
                    Date.now() - timestamp <= module.repeatInterval
            );

            if (filtered.length) {
                mentionCache.set(key, filtered);
            } else {
                mentionCache.delete(key);
            }
        }, module.repeatInterval + 100);
    }

    return null;
}

function checkCaps(content, module) {
    const letters = content.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g);

    if (!letters || letters.length < module.minimumLength) {
        return false;
    }

    const uppercase = letters.filter(
        char => char === char.toUpperCase()
    ).length;

    const percentage =
        (uppercase / letters.length) * 100;

    return percentage >= module.percentage;
}

module.exports = {
    name: 'messageCreate',

    async execute(message) {
        if (!message.guild) return;
        if (message.author?.bot) return;
        if (!message.member) return;
        if (!message.content?.trim()) return;

        const automod =
            getAutomod(message.guild.id);

        const content = message.content;

        const antiinvite = automod.antiinvite;

        if (
            antiinvite.enabled &&
            !isWhitelisted(message, antiinvite) &&
            INVITE_REGEX.test(content)
        ) {
            await takeAction(
                message,
                antiinvite,
                'antiinvite',
                'Invitation Discord détectée'
            );

            return;
        }

        const antilink = automod.antilink;

        if (
            antilink.enabled &&
            !isWhitelisted(message, antilink) &&
            URL_REGEX.test(content)
        ) {
            await takeAction(
                message,
                antilink,
                'antilink',
                'Lien URL détecté'
            );

            return;
        }

        const antiwords = automod.antiwords;

        if (
            antiwords.enabled &&
            antiwords.words.length &&
            !isWhitelisted(message, antiwords)
        ) {
            const lower =
                content.toLowerCase();

            const found =
                antiwords.words.find(word =>
                    lower.includes(word.toLowerCase())
                );

            if (found) {
                await takeAction(
                    message,
                    antiwords,
                    'antiwords',
                    `Mot interdit détecté : ${found}`
                );

                return;
            }
        }

        const antispam = automod.antispam;

        if (
            antispam.enabled &&
            !isWhitelisted(message, antispam)
        ) {
            const reason =
                checkSpam(message, antispam);

            if (reason) {
                await takeAction(
                    message,
                    antispam,
                    'antispam',
                    reason
                );

                return;
            }
        }

        const anticaps = automod.anticaps;

        if (
            anticaps.enabled &&
            !isWhitelisted(message, anticaps) &&
            checkCaps(content, anticaps)
        ) {
            await takeAction(
                message,
                anticaps,
                'anticaps',
                'Message excessivement en majuscules'
            );

            return;
        }

        const antimention = automod.antimention;

        if (
            antimention.enabled &&
            !isWhitelisted(message, antimention)
        ) {
            const reason =
                checkMentions(message, antimention);

            if (reason) {
                await takeAction(
                    message,
                    antimention,
                    'antimention',
                    reason
                );
            }
        }
    }
};
