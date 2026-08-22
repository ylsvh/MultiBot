const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roi-lion')
        .setDescription("Dessine l'avatar d'un utilisateur sur la scène du Roi Lion.")
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
                path.join(__dirname, '../../assets/images/roi-lion.png')
            );

            const fetchRes = await fetch(avatarURL);
            const avatarBuffer = Buffer.from(
                await fetchRes.arrayBuffer()
            );

            const avatar = await loadImage(avatarBuffer);

            const canvas = createCanvas(
                base.width,
                base.height
            );

            const ctx = canvas.getContext('2d');

            ctx.drawImage(base, 0, 0);

            ctx.save();
            ctx.translate(180, 200);
            ctx.rotate(-24 * Math.PI / 180);
            ctx.drawImage(avatar, -65, -75, 130, 150);
            ctx.restore();

            return await interaction.reply({
                files: [{
                    attachment: canvas.toBuffer(),
                    name: 'roi-lion.png'
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