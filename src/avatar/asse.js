const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('approuver')
        .setDescription('Génère une image approuvée avec l’avatar d’un utilisateur')
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

            const base = await loadImage(
                path.join(__dirname, '../../assets/images/approuver.png')
            );

            const canvas = createCanvas(
                avatar.width,
                avatar.height
            );

            const ctx = canvas.getContext('2d');

            ctx.drawImage(
                avatar,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const scale = Math.min(
                canvas.width / base.width,
                canvas.height / base.height
            );

            const width = base.width * scale;
            const height = base.height * scale;

            const x = (canvas.width - width) / 2;
            const y = (canvas.height - height) / 2;

            ctx.drawImage(
                base,
                x,
                y,
                width,
                height
            );

            const buffer = canvas.toBuffer();

            if (buffer.length > 8 * 1024 * 1024) {
                return await interaction.reply("L'image dépasse 8 Mo.");
            }

            return await interaction.reply({
                files: [
                    {
                        attachment: buffer,
                        name: 'approuver.png'
                    }
                ]
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