const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pixel')
        .setDescription('Transforme un avatar en image pixelisée.')
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

            const avatar = await loadImage(avatarURL);

            const canvas = createCanvas(
                avatar.width,
                avatar.height
            );

            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            const size = 16;

            ctx.drawImage(
                avatar,
                0,
                0,
                size,
                size
            );

            ctx.drawImage(
                canvas,
                0,
                0,
                size,
                size,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const buffer = canvas.toBuffer();

            if (buffer.length > 8 * 1024 * 1024) {
                return await interaction.reply("L'image dépasse 8 Mo.");
            }

            await interaction.reply({
                files: [{
                    attachment: buffer,
                    name: 'pixel.png'
                }]
            });

        } catch (err) {
            console.error(err);

            if (interaction.replied || interaction.deferred) {
                return await interaction.followUp(
                    "Erreur lors de la génération de l'image."
                );
            }

            return await interaction.reply(
                "Erreur lors de la génération de l'image."
            );
        }
    }
};