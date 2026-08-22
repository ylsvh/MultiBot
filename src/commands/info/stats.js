const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const STATS_FILE = path.join(__dirname, "../../data/messageStats.json");

function loadStats() {
    if (!fs.existsSync(STATS_FILE)) return {};
    return JSON.parse(fs.readFileSync(STATS_FILE, "utf8"));
}

module.exports = {
    name: "stats",
    description: "Affiche les statistiques messages d'un membre",

    async execute(client, message, args) {
        await message.channel.sendTyping();
        const member = message.mentions.members.first() || message.member;
        const stats = loadStats();

        const memberStats = stats[member.id] || {
            total: 0,
            channels: {},
        };

        let topChannel = "Aucun";

        if (memberStats.channels && Object.keys(memberStats.channels).length > 0) {
            const sorted = Object.entries(memberStats.channels)
                .sort((a, b) => b[1] - a[1]);

            topChannel = `<#${sorted[0][0]}> (${sorted[0][1]} messages)`;
        }

        const container = new ContainerBuilder()
            .setAccentColor(0x2B2D31);

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## 📊 Stats — ${member.user.tag}`
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `📨 **Messages envoyés :** ${memberStats.total}\n` +
                `🏷️ **Top salon :** ${topChannel}`
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(1)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `-# Statistiques de message utilisateur`
            )
        );

        return message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    }
};