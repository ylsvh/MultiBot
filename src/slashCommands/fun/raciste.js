const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('raciste')
        .setDescription('Calcule un pourcentage de racisme (fun) d’un membre')
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
            .setTitle('<:WillehadOuiCMoi:1497130793997439098> Test de racisme')
            .setDescription(`${user.tag} est à **${percentage}% raciste !**`)
            .setColor('#0f0f0f')
            .setFooter({
                text: 'Ceci est une commande troll, ne la prenez pas au sérieux !'
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};