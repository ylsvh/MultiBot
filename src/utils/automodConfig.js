const guildConfig = require('./guildConfig');

const ACTIONS = ['delete', 'warn', 'mute', 'kick', 'ban'];

const ACTION_LABELS = {
    delete: '🗑️ Suppression',
    warn: '⚠️ Suppression + avertissement',
    mute: '🔇 Suppression + mute 10 min',
    kick: '👢 Suppression + expulsion',
    ban: '🔨 Suppression + bannissement'
};

const MODULE_INFO = {
    antiinvite: {
        emoji: '🔗',
        label: 'Anti-invitations',
        description: 'Bloque les invitations Discord.'
    },
    antilink: {
        emoji: '🌐',
        label: 'Anti-liens',
        description: 'Bloque les liens externes.'
    },
    antiwords: {
        emoji: '🚫',
        label: 'Anti-mots',
        description: 'Bloque les mots et expressions interdits.'
    },
    antispam: {
        emoji: '📨',
        label: 'Anti-spam',
        description: 'Détecte les envois répétitifs ou trop rapides.'
    },
    anticaps: {
        emoji: '🔠',
        label: 'Anti-majuscules',
        description: 'Détecte les messages abusivement écrits en majuscules.'
    },
    antimention: {
        emoji: '📢',
        label: 'Anti-mentions',
        description: 'Détecte les mentions massives et le spam de mentions.'
    }
};

const BASE_MODULE = {
    enabled: false,
    action: 'delete',
    whitelistRoles: [],
    whitelistChannels: [],
    whitelistUsers: [],
    managerRoles: []
};

const DEFAULT_CONFIG = {
    antiinvite: {
        ...BASE_MODULE
    },

    antilink: {
        ...BASE_MODULE
    },

    antiwords: {
        ...BASE_MODULE,
        words: []
    },

    antispam: {
        ...BASE_MODULE,
        maxMessages: 5,
        interval: 5000,
        duplicateLimit: 3
    },

    anticaps: {
        ...BASE_MODULE,
        minimumLength: 10,
        percentage: 70
    },

    antimention: {
        ...BASE_MODULE,
        maxUsers: 5,
        maxRoles: 3,
        maxTotal: 5,
        repeatLimit: 5,
        repeatInterval: 10000
    }
};

function clone(data) {
    return JSON.parse(JSON.stringify(data));
}

function getAutomod(guildId) {
    const config = guildConfig.getAll(guildId);
    const saved = config.automod || {};

    const result = {};

    for (const [name, defaults] of Object.entries(DEFAULT_CONFIG)) {
        const savedModule = saved[name] || {};

        result[name] = {
            ...clone(defaults),
            ...savedModule
        };

        result[name].whitelistRoles = Array.isArray(savedModule.whitelistRoles)
            ? savedModule.whitelistRoles
            : [];

        result[name].whitelistChannels = Array.isArray(savedModule.whitelistChannels)
            ? savedModule.whitelistChannels
            : [];

        result[name].whitelistUsers = Array.isArray(savedModule.whitelistUsers)
            ? savedModule.whitelistUsers
            : [];

        result[name].managerRoles = Array.isArray(savedModule.managerRoles)
            ? savedModule.managerRoles
            : [];

        if (name === 'antiwords') {
            result[name].words = Array.isArray(savedModule.words)
                ? savedModule.words
                : [];
        }
    }

    return result;
}

function getModule(guildId, moduleName) {
    return getAutomod(guildId)[moduleName] || null;
}

function setModule(guildId, moduleName, data) {
    const automod = getAutomod(guildId);
    automod[moduleName] = data;
    guildConfig.set(guildId, 'automod', automod);
}

function setModuleField(guildId, moduleName, field, value) {
    const module = getModule(guildId, moduleName);

    if (!module) return;

    module[field] = value;
    setModule(guildId, moduleName, module);
}

function isAdmin(member) {
    return Boolean(
        member?.permissions?.has('Administrator')
    );
}

function isWhitelisted(message, module) {
    if (!message?.member || !module) return false;

    if (module.whitelistUsers.includes(message.author.id)) {
        return true;
    }

    if (module.whitelistChannels.includes(message.channel.id)) {
        return true;
    }

    return module.whitelistRoles.some(roleId =>
        message.member.roles.cache.has(roleId)
    );
}

module.exports = {
    ACTIONS,
    ACTION_LABELS,
    MODULE_INFO,
    DEFAULT_CONFIG,
    getAutomod,
    getModule,
    setModule,
    setModuleField,
    isAdmin,
    isWhitelisted
};
