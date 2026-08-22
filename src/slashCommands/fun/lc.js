const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lc')
        .setDescription('Calcule le pourcentage d’amour entre deux membres')
        .addUserOption(option =>
            option
                .setName('membre1')
                .setDescription('Le premier membre')
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('membre2')
                .setDescription('Le deuxième membre')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const user1 = interaction.options.getUser('membre1');
        const user2 = interaction.options.getUser('membre2') || interaction.user;

        const lovePercent = Math.floor(Math.random() * 101);

        const totalHearts = 10;
        const fullHearts = Math.round((lovePercent / 100) * totalHearts);
        const emptyHearts = totalHearts - fullHearts;

        const heartBar =
            '❤️'.repeat(fullHearts) +
            '🖤'.repeat(emptyHearts);

        const embed = new EmbedBuilder()
            .setTitle('💖 Love Calculator 💖')
            .setDescription(
                `💘 **${user1.username}** + **${user2.username}** 💘`
            )
            .addFields(
                {
                    name: 'Pourcentage d’amour',
                    value: `**${lovePercent}%**`,
                    inline: true
                },
                {
                    name: 'Affection',
                    value: heartBar,
                    inline: false
                }
            )
            .setColor('#FF69B4')
            .setThumbnail(
                user1.displayAvatarURL({ dynamic: true })
            )
            .setImage(
                user2.displayAvatarURL({ dynamic: true })
            )
            .setFooter({
                text: 'Love Calculator ❤️'
            })
            .setTimestamp();

        await interaction.editReply({
            embeds: [embed]
        });
    }
};