const guildConfig = require('../utils/guildConfig');

module.exports = {
  name: 'messageCreate',
  once: false,
  execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const prefix = guildConfig.get(message.guild.id, 'prefix') || client.prefix;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
      if (typeof command.execute === 'function') {
        command.execute(client, message, args);
      } else if (typeof command.run === 'function') {
        command.run(client, message, args);
      } else {
        throw new Error(`La commande ${commandName} n\'a pas de méthode exécutable.`);
      }
    } catch (err) {
      console.error(err);
      message.reply('❌ Erreur pendant l\'exécution de la commande.');
    }
  }
};
