const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "../data/antiraid.json");
const cache = new Map();

function loadData() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "{}");
    }
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function checkRaid(client, guild, user, type, reason) {
    const data = loadData();
    const config = data[guild.id];
    if (!config) return;
    if (config.whitelist.includes(user.id)) return;
    const key = `${guild.id}-${user.id}-${type}`;
    const count = (cache.get(key) || 0) + 1;
    cache.set(key, count);
    setTimeout(() => {
        cache.delete(key);
    }, 10000);
    if (count < config.limits[type]) return;
    const sanction = config.sanctions[type];
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (sanction === "ban") {
        await guild.members.ban(user.id, {
            reason: `Anti-Raid : ${reason}`
        }).catch(() => {});
    }
    if (sanction === "kick" && member) {
        await member.kick(`Anti-Raid : ${reason}`)
            .catch(() => {});
    }
    if (sanction === "remove" && member) {
        await member.roles.set([])
            .catch(() => {});
    }
    const log = guild.channels.cache.get(config.logs);
    if (log) {
        log.send({
            content:
                `🛡️ **Anti-Raid déclenché**\n\n` +
                `Utilisateur : ${user.tag}\n` +
                `Action : ${reason}\n` +
                `Sanction : ${sanction}`
        });
    }
    cache.delete(key);
}
module.exports = {
    checkRaid
};
