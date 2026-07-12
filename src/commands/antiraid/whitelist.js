const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../../../data/antiraid.json");

function loadData() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "{}");
    }

    return JSON.parse(fs.readFileSync(file, "utf8"));
}

module.exports = {
    name: "whitelist",
    description: "Affiche la whitelist anti-raid",

    async execute(client, message, args) {

        const data = loadData();

        if (!data[message.guild.id]) {
            return message.reply("❌ L'anti-raid n'est pas configuré.");
        }

        const whitelist = data[message.guild.id].whitelist;

        if (!whitelist.length) {
            return message.reply("📋 La whitelist anti-raid est vide.");
        }

        const users = [];

        for (const id of whitelist) {
            try {
                const user = await client.users.fetch(id);
                users.push(`• ${user.tag} (\`${id}\`)`);
            } catch {
                users.push(`• Utilisateur inconnu (\`${id}\`)`);
            }
        }

        return message.reply({
            content:
                `# 🛡️ Whitelist Anti-Raid\n\n` +
                users.join("\n") +
                `\n\nTotal : **${whitelist.length}**`
        });
    }
};