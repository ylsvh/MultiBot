const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'setvisibility',
    description: "Change la visibilité d'un salon (public/privé)",

    async execute(client, message, args) {
        await message.channel.sendTyping();
        if (!message.guild || !message.member) {
            return message.reply("Cette commande ne peut être utilisée que dans un serveur.");
        }

        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply("Vous n'avez pas la permission de gérer les salons.");
        }

        const channel =
            message.mentions.channels.first() ||
            message.guild.channels.cache.get(args[0]) ||
            message.channel;

        if (!channel) {
            return message.reply("Salon introuvable.");
        }

        const visibility = args.find(arg =>
            ['public', 'privé', 'prive', 'private'].includes(arg.toLowerCase())
        );

        if (!visibility) {
            return message.reply(
                "Utilisation : `setvisibility [#salon] <public|privé>`"
            );
        }

        if (['public'].includes(visibility.toLowerCase())) {
            await channel.permissionOverwrites.edit(
                message.guild.roles.everyone,
                { ViewChannel: true }
            );

            return message.reply(
                `✅ Le salon **${channel.name}** est maintenant public.`
            );
        }

        if (['privé', 'prive', 'private'].includes(visibility.toLowerCase())) {
            await channel.permissionOverwrites.edit(
                message.guild.roles.everyone,
                { ViewChannel: false }
            );

            return message.reply(
                `✅ Le salon **${channel.name}** est maintenant privé.`
            );
        }
    },
};