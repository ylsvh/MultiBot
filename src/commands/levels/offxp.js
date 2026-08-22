const guildconfig = require('../../utils/guildConfig');

module.exports = {
    name: "offxp",
    description: "Désactiver le système d'XP",

    async execute(client, message) {

        if (!guildconfig.isBotOwner(message.guild.id, message.author.id)) {
            return message.reply("❗ Tu n'as pas la permission.");
        }

        guildconfig.set(message.guild.id, "xpEnabled", false);

        return message.reply("❌ Le système d'XP est maintenant **désactivé**.");
    }
};