const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nickelback')
        .setDescription('Génère une image Nickelback avec un avatar.')
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
                path.join(__dirname, '../../assets/images/nickelback.png')
            );

            const avatar = await loadImage(avatarURL);

            const canvas = createCanvas(base.width, base.height);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(
                base,
                0,
                0,
                canvas.width,
                canvas.height
            );

            ctx.save();

            const angle = -13.5 * (Math.PI / 180);

            ctx.translate(
                280 + 175 / 2,
                218 + 125 / 2
            );

            ctx.rotate(angle);

            ctx.drawImage(
                avatar,
                -175 / 2,
                -125 / 2,
                175,
                125
            );

            ctx.restore();

            const buffer = canvas.toBuffer();

            if (buffer.length > 8 * 1024 * 1024) {
                return await interaction.reply("L'image dépasse 8 Mo.");
            }

            await interaction.reply({
                files: [{
                    attachment: buffer,
                    name: 'nickelback.png'
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