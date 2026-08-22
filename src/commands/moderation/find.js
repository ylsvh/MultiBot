const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'find',
    description: 'Trouve un membre dans un salon vocal ou indique dans quel salon il est',

    async execute(client, message, args) {
        if (!message.guild) return;

        if (!args.length) return message.reply("❌ Utilisation : `+find <membre>`");
        await message.guild.members.fetch();
        const query = args.join(" ").toLowerCase();

        const member = message.guild.members.cache.find(m =>
            m.user.tag.toLowerCase().includes(query) ||
            m.user.username.toLowerCase().includes(query) ||
            m.id === query
        );

        if (!member) return message.reply("❌ Aucun membre trouvé.");

        if (!member.voice.channel) {
            return message.reply(`❌ ${member.user.tag} n'est connecté à aucun salon vocal.`);
        }

        const embed = new EmbedBuilder()
            .setTitle(`🎤 Membre trouvé`)
            .setDescription(`${member.user.tag} est connecté dans : **${member.voice.channel.name}**`)
            .setColor('#5865F2')
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
