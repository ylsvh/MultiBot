const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.js');
const backup = require('discord-backup');

module.exports = {
    name: 'infobackup',
    description: 'Afficher les informations d une sauvegarde',

    async execute(client, message, args) {
        if (message.author.id !== config.ownerId) {
            return message.reply("Tu n'as pas la permission d'utiliser cette commande.");
        }

        try {
            const backupId = args[0];

            if (!backupId) {
                return message.reply("Donne l'ID de la sauvegarde à afficher.");
            }

            const backupData = await backup.fetch(backupId);

            if (!backupData) {
                return message.reply("Cette sauvegarde n'existe pas.");
            }

            const embed = new EmbedBuilder()
                .setTitle('Informations sur la sauvegarde')
                .setDescription(
                    `**ID :** \`${backupData.id}\`\n` +
                    `**Serveur :** ${backupData.data.name}\n` +
                    `**Créée le :** <t:${Math.floor(backupData.createdTimestamp / 1000)}:F>`
                )
                .setColor('#00ff00')
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            return message.reply("Erreur lors de la récupération des informations de la sauvegarde.");
        }
    }
};
