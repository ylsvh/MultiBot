const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../../../data/starboard.json");

module.exports = {
    name: "setstarboard",
    description: "Configure le starboard, modifie la limite ou affiche le classement",

    async execute(client, message, args) {
        await message.channel.sendTyping();

        const data = JSON.parse(fs.readFileSync(file, "utf8"));

        // TOP STARBOARD
        if (args[0] === "top") {

            const guildData = data.guilds[message.guild.id];

            if (!guildData || !guildData.users || Object.keys(guildData.users).length === 0) {
                return message.reply("❌ Aucun classement disponible.");
            }

            const top = Object.entries(guildData.users)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            const embed = new EmbedBuilder()
                .setColor("Yellow")
                .setTitle("⭐ Top Starboard")
                .setDescription(
                    top.map((user, index) =>
                        `**${index + 1}.** <@${user[0]}> — ⭐ ${user[1]}`
                    ).join("\n")
                )
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }


        // MODIFIER LA LIMITE
        if (args[0] === "limit") {

            if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return message.reply("❌ Tu n'as pas la permission.");
            }

            const guildData = data.guilds[message.guild.id];

            if (!guildData) {
                return message.reply("❌ Le starboard n'est pas configuré.");
            }

            const limit = Number(args[1]);

            if (!limit || limit < 1) {
                return message.reply("❌ Utilisation : `+setstarboard limit 10`");
            }

            guildData.limit = limit;

            fs.writeFileSync(file, JSON.stringify(data, null, 4));

            const embed = new EmbedBuilder()
                .setColor("Yellow")
                .setDescription(`⭐ Limite du starboard modifiée à **${limit} étoiles**`)
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }


        // CONFIGURATION DU SALON
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply("❌ Tu n'as pas la permission.");
        }

        const channel = message.mentions.channels.first();

        if (!channel) {
            return message.reply(
                "❌ Utilisation :\n" +
                "`+setstarboard #starboard`\n" +
                "`+setstarboard limit 10`\n" +
                "`+setstarboard top`"
            );
        }


        data.guilds[message.guild.id] = {
            channel: channel.id,
            limit: 5,
            messages: {},
            users: {}
        };


        fs.writeFileSync(file, JSON.stringify(data, null, 4));


        const embed = new EmbedBuilder()
            .setColor("Yellow")
            .setDescription(`⭐ Starboard configuré dans ${channel}`)
            .setTimestamp();


        return message.reply({
            embeds: [embed]
        });
    }
};