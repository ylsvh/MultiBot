const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("quiz")
        .setDescription("Lance un quiz"),

    async execute(interaction, client) {
        const questions = [
            {
                question: "Quel jeu a été créé par Roblox Corporation ?",
                answers: ["Minecraft", "Roblox", "Fortnite", "GTA"],
                correct: 1
            },
            {
                question: "Combien font 5 × 6 ?",
                answers: ["11", "25", "30", "60"],
                correct: 2
            },
            {
                question: "Quelle planète est la plus proche du Soleil ?",
                answers: ["Mars", "Mercure", "Vénus", "Terre"],
                correct: 1
            }
        ];

        const q = questions[Math.floor(Math.random() * questions.length)];

        const embed = new EmbedBuilder()
            .setTitle("Quiz")
            .setDescription(q.question);

        const row = new ActionRowBuilder();

        q.answers.forEach((answer, i) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`quiz_${i}`)
                    .setLabel(answer)
                    .setStyle(ButtonStyle.Primary)
            );
        });

        const gameMessage = await interaction.reply({
            embeds: [embed],
            components: [row],
            withResponse: true
        });

        const message = gameMessage.resource?.message || await interaction.fetchReply();

        const collector = message.createMessageComponentCollector({
            time: 30000
        });

        collector.on("collect", async i => {
            const choice = parseInt(i.customId.split("_")[1]);

            if (choice === q.correct) {
                embed.setDescription(
                    `Bonne réponse ! 🎉\n\nLa réponse était **${q.answers[q.correct]}**`
                );
            } else {
                embed.setDescription(
                    `Mauvaise réponse.\n\nLa bonne réponse était **${q.answers[q.correct]}**`
                );
            }

            collector.stop();

            await i.update({
                embeds: [embed],
                components: []
            });
        });

        collector.on("end", async collected => {
            if (collected.size === 0) {
                embed.setDescription(
                    `Temps écoulé.\n\nLa réponse était **${q.answers[q.correct]}**`
                );

                await message.edit({
                    embeds: [embed],
                    components: []
                }).catch(() => {});
            }
        });
    }
};