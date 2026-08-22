const Discord = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const guildconfig = require("../../utils/guildConfig");

module.exports = {
    name: "rank",
    description: "Afficher le niveau d'un utilisateur",

    async execute(client, message, args) {

        const user =
            message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]) ||
            message.member;

        const data = guildconfig.getAll(message.guild.id);

        if (!data.levels) data.levels = {};

        if (!data.levels[user.id]) {
            data.levels[user.id] = {
                level: 0,
                xp: 0
            };
        }

        const level = data.levels[user.id].level;
        const xp = data.levels[user.id].xp;

        const nextLevelXp = (level + 1) * 100;
        const neededXp = nextLevelXp - xp;

        const embed = new Discord.EmbedBuilder()
            .setColor("#0099ff")
            .setTitle(`Niveau de ${user.user.tag}`)
            .addFields(
                { name: "Niveau", value: `${level}`, inline: true },
                { name: "XP", value: `${xp} / ${nextLevelXp}`, inline: true },
                { name: "XP nécessaire pour le prochain niveau", value: `${neededXp}`, inline: false }
            )
            .setThumbnail(user.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Demandé par ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        return message.channel.send({ embeds: [embed] });
    }
};