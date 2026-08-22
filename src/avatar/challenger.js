const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('challenger')
        .setDescription('Ajoute un avatar au template Challenger')
        .addUserOption(option =>
            option
                .setName('membre')
                .setDescription('Le membre dont utiliser l’avatar')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('silhouette')
                .setDescription('Affiche l’avatar en silhouette')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser('membre') || interaction.user;
            const silhouetted = interaction.options.getBoolean('silhouette') || false;

            const avatarURL = user.displayAvatarURL({
                extension: 'png',
                size: 512
            });

            const base = await loadImage(
                path.join(__dirname, '../../assets/images/challenger.png')
            );

            const avatar = await loadImage(avatarURL);

            const canvas = createCanvas(base.width, base.height);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(base, 0, 0);

            let finalAvatar = avatar;

            if (silhouetted) {
                const tempCanvas = createCanvas(avatar.width, avatar.height);
                const tempCtx = tempCanvas.getContext('2d');

                tempCtx.drawImage(avatar, 0, 0);

                tempCtx.globalCompositeOperation = 'source-in';
                tempCtx.fillStyle = '#000000';
                tempCtx.fillRect(
                    0,
                    0,
                    tempCanvas.width,
                    tempCanvas.height
                );

                finalAvatar = tempCanvas;
            }

            ctx.drawImage(finalAvatar, 484, 98, 256, 256);

            const buffer = canvas.toBuffer();

            if (buffer.length > 8 * 1024 * 1024) {
                return await interaction.reply("L'image dépasse 8 Mo.");
            }

            await interaction.reply({
                files: [{
                    attachment: buffer,
                    name: 'challenger.png'
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