const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../../data");
const file = path.join(dataDir, "stats.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function load() {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, "{}");
            return {};
        }

        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return {};
    }
}

let data = load();

function save() {
    try {
        fs.writeFileSync(file, JSON.stringify(data));
    } catch (err) {
        console.error("Erreur sauvegarde stats :", err);
    }
}

function getGuild(guildId) {
    if (!data[guildId]) {
        data[guildId] = {
            messages: [],
            voice: []
        };
    }

    if (!Array.isArray(data[guildId].messages)) {
        data[guildId].messages = [];
    }

    if (!Array.isArray(data[guildId].voice)) {
        data[guildId].voice = [];
    }

    return data[guildId];
}

function addMessage(message) {
    if (!message.guild || !message.author || message.author.bot) return;

    const guild = getGuild(message.guild.id);

    guild.messages.push({
        userId: message.author.id,
        channelId: message.channel.id,
        timestamp: Date.now()
    });

    cleanup(message.guild.id);
    save();
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

    if (duration <= 0) return;

    const guild = getGuild(guildId);

    guild.voice.push({
        userId,
        channelId,
        startedAt,
        endedAt,
        duration
    });

    cleanup(guildId);
    save();
}

function cleanup(guildId) {
    const guild = getGuild(guildId);
    const limit = Date.now() - (14 * 24 * 60 * 60 * 1000);

    guild.messages = guild.messages.filter(
        x => x.timestamp >= limit
    );

    guild.voice = guild.voice.filter(
        x => x.endedAt >= limit
    );
}

function getStats(guildId, days) {
    const guild = getGuild(guildId);

    cleanup(guildId);

    const since = Date.now() - (days * 24 * 60 * 60 * 1000);

    return {
        messages: guild.messages.filter(
            x => x.timestamp >= since
        ),

        voice: guild.voice.filter(
            x => x.endedAt >= since
        )
    };
}

module.exports = {
    addMessage,
    addVoiceSession,
    getStats,
    cleanup
};
