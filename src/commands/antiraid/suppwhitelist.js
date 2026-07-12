const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../../../data/antiraid.json");

function loadData() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "{}");
    }

    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveData(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

module.exports = {
    name: "suppwhitelist",
    description: "Retire un utilisateur de la whitelist anti-raid",

    async execute(client, message, args) {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Vous devez être administrateur.");
        }

        const user = message.mentions.users.first();

        if (!user) {
            return message.reply("❌ Mentionnez un utilisateur.");
        }

        const data = loadData();

        if (!data[message.guild.id]) {
            return message.reply("❌ L'anti-raid n'est pas configuré.");
        }

        const config = data[message.guild.id];

        if (!config.whitelist.includes(user.id)) {
            return message.reply("❌ Cet utilisateur n'est pas dans la whitelist.");
        }

        config.whitelist = config.whitelist.filter(id => id !== user.id);

        saveData(data);

        return message.reply(
            `✅ ${user} a été retiré de la whitelist anti-raid.`
        );
    }
};