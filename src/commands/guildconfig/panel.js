const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: "panel",
    description: "Panneau admin sécurité",
    async execute(client, message, args) {
        await message.channel.sendTyping();

        if (!message.member.permissions.has("Administrator"))
            return message.reply("❌ Réservé aux admins.");

        const embed = new EmbedBuilder()
            .setTitle("Panel de sécurité")
            .setDescription("Clique sur un bouton pour activer le système.")
            .setColor("Blue");

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("enable_captcha")
                    .setLabel("Activer Captcha")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("enable_antiraid")
                    .setLabel("Activer AntiRaid")
                    .setStyle(ButtonStyle.Danger)
            );

        message.channel.send({ embeds: [embed], components: [row] });
    }
};
