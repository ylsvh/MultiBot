const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.js');
const backup = require('discord-backup');

module.exports = {
    name: 'chargerbackup',
    description: 'Charger une sauvegarde du serveur',

    async execute(client, message, args) {
        if (message.author.id !== config.ownerId) {
            return message.reply("Tu n'as pas la permission d'utiliser cette commande.");
        }

        try {
            const backupId = args[0];

            if (!backupId) {
                return message.reply("Donne l'ID de la sauvegarde à charger.");
            }

            await backup.load(backupId, {
                client: client,
                guild: message.guild,
                clearGuildBeforeRestore: true
            });

            const embed = new EmbedBuilder()
                .setTitle('Sauvegarde chargée')
                .setDescription(`La sauvegarde avec l'ID \`${backupId}\` a été chargée avec succès.`)
                .setColor('#00ff00')
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            return message.reply("Erreur lors du chargement de la sauvegarde. Vérifie que l'ID est correct.");
        }
    }
};
