const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kyon-flingue')
        .setDescription('Affiche un avatar avec Kyon et son flingue.')
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
                path.join(__dirname, '../../assets/images/kyon-flingue.png')
            );

            const avatar = await loadImage(avatarURL);

            const canvas = createCanvas(base.width, base.height);
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const ratio = avatar.width / avatar.height;
            const width = Math.round(canvas.height * ratio);
            const x = (canvas.width / 2) - (width / 2);

            ctx.drawImage(
                avatar,
                x,
                0,
                width,
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
                return await interaction.reply("L'image dépasse 8 Mo.");
            }

            await interaction.reply({
                files: [{
                    attachment: buffer,
                    name: 'kyon-flingue.png'
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