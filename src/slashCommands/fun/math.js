const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('math')
        .setDescription('Effectue un calcul')
        .addStringOption(option =>
            option
                .setName('expression')
                .setDescription('Exemple : 2+2')
                .setRequired(true)
        ),

    async execute(interaction) {
        const expression = interaction.options
            .getString('expression')
            .replace(/\s+/g, '')
            .trim();

        if (!/^[0-9+\-*/().]+$/.test(expression)) {
            return interaction.reply('Expression invalide');
        }

        let result;

        try {
            result = Function(`"use strict"; return (${expression})`)();
        } catch {
            return interaction.reply('Calcul invalide');
        }

        if (!Number.isFinite(result)) {
            return interaction.reply('Calcul invalide');
        }

        await interaction.reply(`Résultat : ${result}`);
    }
};