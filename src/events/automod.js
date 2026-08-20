const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const {
    getAutomod,
    isWhitelisted
} = require('../utils/automodConfig');

const { sendLog } = require('../utils/logHelper');

const WARNINGS_FILE = path.join(__dirname, '../../data/warnings.json');

const INVITE_REGEX =
    /(?:https?:\/\/)?(?:www\.)?(?:discord(?:app)?\.(?:gg|com\/invite)\/[a-zA-Z0-9-]+)/gi;

const URL_REGEX =
    /(?:https?:\/\/|www\.)[^\s<>"`]+/gi;

const spamCache = new Map();

const ACTION_COLORS = {
    delete: 0x99AAB5,
    warn: 0xFEE75C,
    mute: 0xF04747,
    kick: 0xED4245,
    ban: 0x36393F
};

const ACTION_LABELS = {
    delete: '🗑️ Message supprimé',
    warn: '⚠️ Avertissement',
    mute: '🔇 Mute 10 minutes',
    kick: '👢 Expulsion',
    ban: '🔨 Bannissement'
};

const MODULE_LABELS = {
    antiinvite: '🔗 Anti-Invitations',
    antilink: '🌐 Anti-Liens',
    antiwords: '🚫 Anti-Mots',
    antispam: '📨 Anti-Spam',
    anticaps: '🔠 Anti-Majuscules',
    antimention: '📢 Anti-Mentions'
};

function loadWarnings() {
    if (!fs.existsSync(WARNINGS_FILE)) return {};

    try {
        return JSON.parse(fs.readFileSync(WARNINGS_FILE, 'utf8'));
    } catch {
        return {};
    }
}

function saveWarning(guildId, userId, reason, moderator = 'AutoMod') {
    const data = loadWarnings();

    if (!data[guildId]) {
        data[guildId] = {};
    }

    if (!data[guildId][userId]) {
        data[guildId][userId] = [];
    }

    data[guildId][userId].push({
        reason,
        moderator,
        timestamp: Date.now()
    });

    fs.writeFileSync(
        WARNINGS_FILE,
        JSON.stringify(data, null, 2)
    );
}

function isMostlyCaps(text, minimumLength, percentage) {
    const letters = text.match(/[a-zA-ZÀ-ÿ]/g);

    if (!letters || letters.length < minimumLength) {
        return false;
    }

    const upper = letters.filter(char =>
        char === char.toUpperCase()
    ).length;

    return (upper / letters.length) * 100 >= percentage;
}

function getSpamData(guildId, userId) {
    const key = `${guildId}:${userId}`;

    if (!spamCache.has(key)) {
        spamCache.set(key, {
            messages: [],
            lastContent: null,
            duplicates: 0
        });
    }

    return spamCache.get(key);
}

function clearSpamData(guildId, userId) {
    spamCache.delete(`${guildId}:${userId}`);
}

async function takeAction(message, mod, moduleName, reason) {
    const guild = message.guild;
    const member = message.member;
    const action = mod.action || 'delete';

    let deleted = false;

    try {
        await message.delete();
        deleted = true;
    } catch {}

    if (action === 'warn') {
        try {
            saveWarning(
                guild.id,
                member.id,
                `AutoMod (${moduleName}) : ${reason}`
            );
        } catch {}

        try {
            await member.send(
                `⚠️ Vous avez reçu un avertissement sur **${guild.name}**.\n` +
                `**Raison :** ${reason}`
            );
        } catch {}
    }

    if (action === 'mute') {
        if (member.moderatable) {
            try {
                await member.timeout(
                    10 * 60 * 1000,
                    `AutoMod : ${reason}`
                );

                try {
                    await member.send(
                        `🔇 Vous avez été mute pendant **10 minutes** sur **${guild.name}**.\n` +
                        `**Raison :** ${reason}`
                    );
                } catch {}
            } catch {}
        }
    }

    if (action === 'kick') {
        if (member.kickable) {
            try {
                await member.send(
                    `👢 Vous avez été expulsé de **${guild.name}**.\n` +
                    `**Raison :** ${reason}`
                );
            } catch {}

            try {
                await member.kick(`AutoMod : ${reason}`);
            } catch {}
        }
    }

    if (action === 'ban') {
        if (member.bannable) {
            try {
                await member.send(
                    `🔨 Vous avez été banni de **${guild.name}**.\n` +
                    `**Raison :** ${reason}`
                );
            } catch {}

            try {
                await guild.members.ban(member.id, {
                    reason: `AutoMod : ${reason}`,
                    deleteMessageSeconds: 60
                });
            } catch {}
        }
    }

    const container = new ContainerBuilder()
        .setAccentColor(ACTION_COLORS[action] || 0x99AAB5);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## 🛡️ AutoMod — ${MODULE_LABELS[moduleName]}`
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(1).setDivider(true)
    );

    const preview = (message.content || '*Vide*')
        .slice(0, 500)
        .replace(/@everyone/g, '@\u200beveryone')
        .replace(/@here/g, '@\u200bhere');

    const section = new SectionBuilder();

    section.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**👤 Membre :** ${message.author.tag} \`${message.author.id}\`\n` +
            `**📌 Salon :** <#${message.channel.id}>\n` +
            `**⚡ Action :** ${ACTION_LABELS[action] || action}\n` +
            `**🔍 Raison :** ${reason}\n` +
            `**🗑️ Message supprimé :** ${deleted ? 'Oui' : 'Non'}\n\n` +
            `**📝 Message :**\n> ${preview}`
        )
    );

    section.setThumbnailAccessory(
        new ThumbnailBuilder()
            .setURL(message.author.displayAvatarURL({ dynamic: true }))
    );

    container.addSectionComponents(section);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `-# <t:${Math.floor(Date.now() / 1000)}:F>`
        )
    );

    await sendLog(guild, 'automod', container);
}

module.exports = {
    name: 'messageCreate',

    async execute(message, client) {
        if (!message.guild) return;
        if (message.author?.bot) return;
        if (!message.member) return;

        const content = message.content?.trim();

        if (!content) return;

        const automod = getAutomod(message.guild.id);

        const modules = [
            ['antiinvite', automod.antiinvite],
            ['antilink', automod.antilink],
            ['antiwords', automod.antiwords],
            ['antispam', automod.antispam],
            ['anticaps', automod.anticaps],
            ['antimention', automod.antimention]
        ];

        for (const [name, mod] of modules) {
            if (!mod?.enabled) continue;
            if (isWhitelisted(message, mod)) continue;

            if (name === 'antiinvite') {
                INVITE_REGEX.lastIndex = 0;

                if (INVITE_REGEX.test(content)) {
                    await takeAction(
                        message,
                        mod,
                        name,
                        'Invitation Discord détectée'
                    );
                    return;
                }
            }

            if (name === 'antilink') {
                URL_REGEX.lastIndex = 0;

                if (URL_REGEX.test(content)) {
                    await takeAction(
                        message,
                        mod,
                        name,
                        'Lien URL détecté'
                    );
                    return;
                }
            }

            if (name === 'antiwords') {
                const found = mod.words.find(word =>
                    content.toLowerCase().includes(word.toLowerCase())
                );

                if (found) {
                    await takeAction(
                        message,
                        mod,
                        name,
                        `Mot interdit détecté : "${found}"`
                    );
                    return;
                }
            }

            if (name === 'antispam') {
                const data = getSpamData(
                    message.guild.id,
                    message.author.id
                );

                const now = Date.now();

                data.messages = data.messages.filter(
                    timestamp => now - timestamp <= mod.interval
                );

                data.messages.push(now);

                if (
                    data.lastContent &&
                    data.lastContent === content.toLowerCase()
                ) {
                    data.duplicates++;
                } else {
                    data.duplicates = 1;
                }

                data.lastContent = content.toLowerCase();

                if (
                    data.messages.length >= mod.maxMessages ||
                    data.duplicates >= mod.duplicateLimit
                ) {
                    clearSpamData(
                        message.guild.id,
                        message.author.id
                    );

                    await takeAction(
                        message,
                        mod,
                        name,
                        'Spam détecté'
                    );

                    return;
                }
            }

            if (name === 'anticaps') {
                if (
                    isMostlyCaps(
                        content,
                        mod.minimumLength,
                        mod.percentage
                    )
                ) {
                    await takeAction(
                        message,
                        mod,
                        name,
                        'Utilisation excessive des majuscules'
                    );

                    return;
                }
            }

            if (name === 'antimention') {
                const userMentions = message.mentions.users.size;
                const roleMentions = message.mentions.roles.size;
                const totalMentions =
                    userMentions + roleMentions;

                if (
                    userMentions >= mod.maxUsers ||
                    roleMentions >= mod.maxRoles ||
                    totalMentions >= mod.maxTotal
                ) {
                    await takeAction(
                        message,
                        mod,
                        name,
                        'Nombre excessif de mentions'
                    );

                    return;
                }
            }
        }
    }
};
