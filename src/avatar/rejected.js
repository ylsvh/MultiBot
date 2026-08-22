const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rejected')
        .setDescription('Génère une image rejected avec un avatar.')
        .addUserOption(option =>
            option
                .setName('utilisateur')
                .setDescription('Utilisateur à utiliser')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            const user =
                interaction.options.getUser('utilisateur') ||
                interaction.user;

            const avatarURL = user.displayAvatarURL({
                extension: 'png',
                size: 512
            });

            const base = await loadImage(
                path.join(__dirname, '../../assets/images/rejected.png')
            );

            const avatar = await loadImage(avatarURL);

            const canvas = createCanvas(
                base.width,
                base.height
            );

            const ctx = canvas.getContext('2d');

            ctx.drawImage(
                avatar,
                0,
                0,
                canvas.width,
                canvas.height
            );

            ctx.drawImage(
                base,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const buffer = canvas.toBuffer();

            if (buffer.length > 8 * 1024 * 1024) {
                return await interaction.reply("Image trop lourde.");
            }

            return await interaction.reply({
                files: [{
                    attachment: buffer,
                    name: 'rejected.png'
                }]
            });

        } catch (err) {
            console.error(err);

            if (interaction.replied || interaction.deferred) {
                return await interaction.followUp(
                    "Erreur génération rejected."
                );
            }

            return await interaction.reply(
                "Erreur génération rejected."
            );
        }
    }
};