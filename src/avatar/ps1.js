const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ps1')
        .setDescription('Génère une image PS1 avec un avatar.')
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
                path.join(__dirname, '../../assets/images/ps1.png')
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
                639,
                547
            );

            const imageData = ctx.getImageData(
                70,
                399,
                500,
                500
            );

            for (let i = 0; i < imageData.data.length; i += 4) {
                const avg =
                    (
                        imageData.data[i] +
                        imageData.data[i + 1] +
                        imageData.data[i + 2]
                    ) / 3;

                imageData.data[i] = avg;
                imageData.data[i + 1] = avg;
                imageData.data[i + 2] = avg;
            }

            ctx.putImageData(
                imageData,
                70,
                399
            );

            ctx.drawImage(
                base,
                0,
                0
            );

            const buffer = canvas.toBuffer();

            if (buffer.length > 8 * 1024 * 1024) {
                return await interaction.reply("L'image dépasse 8 Mo.");
            }

            await interaction.reply({
                files: [{
                    attachment: buffer,
                    name: 'ps1.png'
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