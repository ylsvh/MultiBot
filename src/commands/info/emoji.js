const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'emoji',
    description: 'Affiche les infos d’un emoji ou liste les emojis du serveur',
    
    async execute(client, message, args) {
        await message.channel.sendTyping();
        if (!message.guild) return;

        const emojiArg = args[0];
        if (emojiArg) {
            const emoji = message.guild.emojis.cache.find(e => e.name === emojiArg.replace(/<:|:>/g, '')) || 
                          message.guild.emojis.cache.get(emojiArg);

            if (!emoji) return message.reply("❌ Emoji introuvable.");

            const embed = new EmbedBuilder()
                .setTitle(`ℹ️ Emoji : ${emoji.name}`)
                .setDescription(`ID : \`${emoji.id}\`\nAnimated : ${emoji.animated ? '✅ Oui' : '❌ Non'}\nURL : [Lien](${emoji.url})`)
                .setColor('#5865F2')
                .setImage(emoji.url)
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        }

        const allEmojis = message.guild.emojis.cache.map(e => e.toString()).join(' ') || 'Aucun emoji';
        const embed = new EmbedBuilder()
            .setTitle(`📜 Emojis de ${message.guild.name}`)
            .setDescription(allEmojis)
            .setColor('#5865F2')
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
