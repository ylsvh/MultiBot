const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.js');
const backup = require('discord-backup');

module.exports = {
    name: 'creebackup',
    description: 'Crée une sauvegarde du serveur',

    async execute(client, message, args) {
        if (message.author.id !== config.ownerId) {
            return message.reply("Tu n'as pas la permission d'utiliser cette commande.");
        }

        try {
            const backupData = await backup.create(message.guild, {
                jsonBeautify: true
            });

            const embed = new EmbedBuilder()
                .setTitle('Sauvegarde créée !')
                .setDescription(`ID de la sauvegarde : \`${backupData.id}\``)
                .setColor('#00f000')
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            return message.reply("Erreur lors de la création de la sauvegarde.");
        }
    }
};
