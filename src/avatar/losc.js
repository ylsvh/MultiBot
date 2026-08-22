const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('losc')
        .setDescription('Ajoute le logo du LOSC à un avatar.')
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
                path.join(__dirname, '../../assets/images/losc.png')
            );

            const canvas = createCanvas(avatar.width, avatar.height);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(
                avatar,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const width = base.width;
            const height = base.height;

            ctx.drawImage(
                base,
                canvas.width - width,
                canvas.height - height,
                width,
                height
            );

            const buffer = canvas.toBuffer();

            if (buffer.length > 8 * 1024 * 1024) {
                return await interaction.reply("L'image dépasse 8 Mo.");
            }

            await interaction.reply({
                files: [{
                    attachment: buffer,
                    name: 'losc.png'
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