const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.js');

const fetchFn = global.fetch || require('node-fetch');

module.exports = {
  name: 'geolocalip',
  aliases: ['ipinformation', 'geolocalisation-ip'],

  async execute(message, args) {
        await message.channel.sendTyping();
    try {
      const ip = args[0];
      if (!ip) return message.reply('Utilisation: geolocalip <ip>');

      const res = await fetchFn(`https://ipinfo.io/${ip}/json?token=f1963241941bec`)
        .then(r => r.json());

      if (!res || res.error) {
        return message.channel.send("Impossible de récupérer les données de cette IP.");
      }

      const embed = new EmbedBuilder()
        .setColor('#2f3136')
        .setTitle(`Résultat pour l'IP : ${ip}`)
        .setThumbnail('https://cdn-icons-png.flaticon.com/512/684/684908.png')
        .setFooter({ text: config.footer || 'IP Info' })
        .setTimestamp()
        .addFields(
          { name: 'Ville', value: res.city || 'N/A', inline: true },
          { name: 'Région', value: res.region || 'N/A', inline: true },
          { name: 'Pays', value: res.country || 'N/A', inline: true },
          { name: 'Code postal', value: res.postal || 'N/A', inline: true },
          { name: 'Organisation', value: res.org || 'N/A', inline: true },
          { name: 'Timezone', value: res.timezone || 'N/A', inline: true },
          { name: 'Hostname', value: res.hostname || 'N/A', inline: false }
        );

      return message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      return message.channel.send('Erreur lors de la récupération des données.');
    }
  }
};