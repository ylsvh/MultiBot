module.exports = {
    name: "allroles",
    description: "Afficher tous les rôles du serveur",
    async execute(client, message, args) {
        await message.channel.sendTyping();
        const roles = message.guild.roles.cache            .filter(role => role.name !== '@everyone')
            .map(role => role.name)
            .join(', ');
        if (!roles) {
            return message.channel.send("❌ Aucun rôle trouvé sur ce serveur.");
        }
        await message.channel.send(`**Rôles du serveur :** ${roles}`);
    }
};
