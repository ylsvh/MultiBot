const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cadre')
        .setDescription('Ajoute un cadre à un avatar')
        .addUserOption(option =>
            option
                .setName('membre')
                .setDescription('Le membre dont utiliser l’avatar')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser('membre') || interaction.user;

            const avatarURL = user.displayAvatarURL({
                extension: 'png',
                size: 512
            });

            const avatar = await loadImage(avatarURL);
            const base = await loadImage(
                path.join(__dirname, '../../assets/images/cadre.png')
            );

            const canvas = createCanvas(avatar.width, avatar.height);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);
            ctx.drawImage(base, 0, 0, canvas.width, canvas.height);

            const buffer = canvas.toBuffer();

            if (buffer.length > 8 * 1024 * 1024) {
                return await interaction.reply("L'image dépasse 8 Mo.");
            }

            await interaction.reply({
                files: [{
                    attachment: buffer,
                    name: 'cadre.png'
                }]
            });
        } catch (err) {
            console.error(err);
            await interaction.reply(
                "Erreur lors de la génération de l'image."
            );
        }
    }
};