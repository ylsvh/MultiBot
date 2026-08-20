const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'setdesc',
    description: 'Définit la description/publicité du serveur (utilisée par +seepub)',
    async execute(client, message, args) {
        await message.channel.sendTyping();
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Vous devez être administrateur pour utiliser cette commande.');
        }
        const description = args.join(' ');
        if (!description) {
            return message.reply('❌ Fournissez une description. Ex : `+setdesc Bienvenue sur mon super serveur !`');
        }
        guildConfig.set(message.guild.id, 'serverDescription', description);
        message.reply(`✅ Description du serveur mise à jour.`);
    },
};
