const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../../../data");
const dbPath = path.join(dataDir, "starboard.sqlite");
const jsonPath = path.join(dataDir, "starboard.json");

const db = new Database(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS starboard (
        guildId TEXT PRIMARY KEY,
        channel TEXT,
        limitStars INTEGER DEFAULT 5
    );

    CREATE TABLE IF NOT EXISTS starboard_users (
        guildId TEXT,
        userId TEXT,
        stars INTEGER DEFAULT 0,
        PRIMARY KEY (guildId, userId)
    );

    CREATE TABLE IF NOT EXISTS starboard_messages (
        guildId TEXT,
        messageId TEXT PRIMARY KEY,
        userId TEXT,
        stars INTEGER DEFAULT 0
    );
`);


function migrateJson() {

    if (!fs.existsSync(jsonPath)) return;

    try {

        const count = db.prepare(
            "SELECT COUNT(*) as count FROM starboard"
        ).get().count;

        if (count > 0) return;


        const data = JSON.parse(
            fs.readFileSync(jsonPath, "utf8")
        );


        const insertConfig = db.prepare(`
            INSERT OR REPLACE INTO starboard (
                guildId,
                channel,
                limitStars
            )
            VALUES (?, ?, ?)
        `);


        const insertUser = db.prepare(`
            INSERT OR REPLACE INTO starboard_users (
                guildId,
                userId,
                stars
            )
            VALUES (?, ?, ?)
        `);


        const insertMessage = db.prepare(`
            INSERT OR REPLACE INTO starboard_messages (
                guildId,
                messageId,
                userId,
                stars
            )
            VALUES (?, ?, ?, ?)
        `);


        const transaction = db.transaction(() => {

            for (const guildId in data.guilds) {

                const guild = data.guilds[guildId];

                insertConfig.run(
                    guildId,
                    guild.channel ?? null,
                    guild.limit ?? 5
                );


                for (const userId in guild.users ?? {}) {

                    insertUser.run(
                        guildId,
                        userId,
                        guild.users[userId]
                    );

                }


                for (const messageId in guild.messages ?? {}) {

                    const msg = guild.messages[messageId];

                    insertMessage.run(
                        guildId,
                        messageId,
                        msg.userId,
                        msg.stars ?? 0
                    );

                }
            }

        });


        transaction();


        fs.renameSync(
            jsonPath,
            jsonPath + ".backup"
        );


        console.log("[STARBOARD] Migration JSON -> SQLite terminée");


    } catch (err) {

        console.error(
            "[STARBOARD] Erreur migration :",
            err
        );

    }
}


migrateJson();



module.exports = {
    name: "setstarboard",
    description: "Configure le starboard, modifie la limite ou affiche le classement",

    async execute(client, message, args) {

        await message.channel.sendTyping();


        const guildId = message.guild.id;


        if (args[0] === "top") {


            const users = db.prepare(`
                SELECT userId, stars
                FROM starboard_users
                WHERE guildId = ?
                ORDER BY stars DESC
                LIMIT 10
            `).all(guildId);


            if (!users.length) {
                return message.reply(
                    "❌ Aucun classement disponible."
                );
            }


            const embed = new EmbedBuilder()
                .setColor("Yellow")
                .setTitle("⭐ Top Starboard")
                .setDescription(
                    users.map((user, index) =>
                        `**${index + 1}.** <@${user.userId}> — ⭐ ${user.stars}`
                    ).join("\n")
                )
                .setTimestamp();


            return message.reply({
                embeds: [embed]
            });
        }



        if (args[0] === "limit") {


            if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return message.reply(
                    "❌ Tu n'as pas la permission."
                );
            }


            const config = db.prepare(`
                SELECT *
                FROM starboard
                WHERE guildId = ?
            `).get(guildId);


            if (!config) {
                return message.reply(
                    "❌ Le starboard n'est pas configuré."
                );
            }


            const limit = Number(args[1]);


            if (!limit || limit < 1) {
                return message.reply(
                    "❌ Utilisation : `+setstarboard limit 10`"
                );
            }


            db.prepare(`
                UPDATE starboard
                SET limitStars = ?
                WHERE guildId = ?
            `).run(
                limit,
                guildId
            );


            const embed = new EmbedBuilder()
                .setColor("Yellow")
                .setDescription(
                    `⭐ Limite du starboard modifiée à **${limit} étoiles**`
                )
                .setTimestamp();


            return message.reply({
                embeds: [embed]
            });

        }



        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply(
                "❌ Tu n'as pas la permission."
            );
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



        db.prepare(`
            INSERT OR REPLACE INTO starboard (
                guildId,
                channel,
                limitStars
            )
            VALUES (?, ?, ?)
        `).run(
            guildId,
            channel.id,
            5
        );



        const embed = new EmbedBuilder()
            .setColor("Yellow")
            .setDescription(
                `⭐ Starboard configuré dans ${channel}`
            )
            .setTimestamp();



        return message.reply({
            embeds: [embed]
        });

    }
};