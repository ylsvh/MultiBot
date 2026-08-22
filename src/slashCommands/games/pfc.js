const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pfc')
        .setDescription('Joue à pierre-feuille-ciseaux contre le bot')
        .addStringOption(option =>
            option
                .setName('choix')
                .setDescription('Ton choix')
                .setRequired(true)
                .addChoices(
                    { name: 'Pierre', value: 'pierre' },
                    { name: 'Feuille', value: 'feuille' },
                    { name: 'Ciseaux', value: 'ciseaux' }
                )
        ),

    async execute(client, interaction) {
        const choices = ['pierre', 'feuille', 'ciseaux'];
        const userChoice = interaction.options.getString('choix');

        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        let result;
        let color;

        if (userChoice === botChoice) {
            result = 'Égalité !';
            color = '#FFA500';
        } else if (
            (userChoice === 'pierre' && botChoice === 'ciseaux') ||
            (userChoice === 'feuille' && botChoice === 'pierre') ||
            (userChoice === 'ciseaux' && botChoice === 'feuille')
        ) {
            result = 'Vous avez gagné ! 🎉';
            color = '#00ff00';
        } else {
            result = 'Vous avez perdu ! 😢';
            color = '#ff0000';
        }

        const embed = new EmbedBuilder()
            .setTitle('Pierre-Feuille-Ciseaux')
            .setDescription(
                `Vous avez choisi **${userChoice}** et le bot a choisi **${botChoice}**.\n\n${result}`
            )
            .setColor(color);

        return interaction.reply({
            embeds: [embed]
        });
    }
};