const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Répond à une question comme une Magic 8-Ball')
        .addStringOption(option =>
            option
                .setName('question')
                .setDescription('La question à poser')
                .setRequired(true)
        ),

    async execute(client, interaction) {
        const question = interaction.options.getString('question');

        const answers = [
            'Oui ✅',
            'Non ❌',
            'Peut-être 🤔',
            'Absolument ✅',
            'Je ne pense pas ❌',
            'Certainement ✅',
            'Impossible ❌',
            'Demande plus tard ⏳',
            'Très probable ✅',
            'Pas sûr 🤷'
        ];

        const response = answers[Math.floor(Math.random() * answers.length)];

        const embed = new EmbedBuilder()
            .setTitle('🎱 Magic 8-Ball')
            .addFields(
                {
                    name: 'Question',
                    value: question
                },
                {
                    name: 'Réponse',
                    value: response
                }
            )
            .setColor('#5865F2')
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};