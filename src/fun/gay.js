const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gay')
        .setDescription('Calcule un pourcentage d’homosexualité (fun) d’un membre')
        .addUserOption(option =>
            option
                .setName('membre')
                .setDescription('Le membre à tester')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const user = interaction.options.getUser('membre') || interaction.user;

        const percentage = Math.floor(Math.random() * 101);

        const embed = new EmbedBuilder()
            .setTitle(`🌈 Test d'homosexualité`)
            .setDescription(`${user.tag} est à **${percentage}% gay !** 🏳️‍🌈`)
            .setColor('#FF69B4')
            .setFooter({
                text: 'Ceci est une commande troll, ne la prenez pas au sérieux !'
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};