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
    name: "addwhitelist",
    description: "Ajoute un utilisateur à la whitelist anti-raid",

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
            data[message.guild.id] = {
                logs: null,
                limits: {
                    roleCreate: 3,
                    roleDelete: 3,
                    channelCreate: 3,
                    channelDelete: 3,
                    ban: 3,
                    kick: 3
                },
                whitelist: []
            };
        }

        const config = data[message.guild.id];

        if (config.whitelist.includes(user.id)) {
            return message.reply("❌ Cet utilisateur est déjà dans la whitelist.");
        }

        config.whitelist.push(user.id);

        saveData(data);

        return message.reply(
            `✅ ${user} a été ajouté à la whitelist anti-raid.`
        );
    }
};