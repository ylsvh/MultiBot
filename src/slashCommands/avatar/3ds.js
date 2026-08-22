const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

registerFont(
    path.join(__dirname, '../../assets/fonts/arial.ttf'),
    {
        family: 'Arial'
    }
);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('3ds')
        .setDescription('Génère une image 3DS avec l’avatar d’un utilisateur')
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
                path.join(__dirname, '../../assets/images/3ds.png')
            );

            const avatar = await loadImage(avatarURL);

            const canvas = createCanvas(base.width, base.height);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(base, 0, 0);

            await interaction.reply({
                files: [
                    {
                        attachment: canvas.toBuffer(),
                        name: '3ds.png'
                    }
                ]
            });
        } catch (err) {
            console.error(err);

            if (interaction.replied || interaction.deferred) {
                return await interaction.followUp(
                    'Erreur lors de la génération de l’image.'
                );
            }

            return await interaction.reply(
                'Erreur lors de la génération de l’image.'
            );
        }
    }
};