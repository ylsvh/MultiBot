const {
    ContainerBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder,
    SectionBuilder
} = require('discord.js');

module.exports = {
    name: 'vc',
    description: 'Affiche les statistiques du serveur',

    async execute(client, message, args) {
        const guild = message.guild;

        const totalMembers = guild.memberCount;

        const onlineMembers = guild.members.cache.filter(member =>
            member.presence &&
            ['online', 'idle', 'dnd'].includes(member.presence.status)
        ).size;

        const voiceMembers = guild.members.cache.filter(
            member => member.voice.channel
        ).size;

        const boosted = guild.premiumSubscriptionCount;

        const iconURL = guild.iconURL({
            extension: 'png',
            size: 1024
        });

        const container = new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(
                                `## Statistiques du serveur ${guild.name}\n` +
                                `> *Membres :* **${totalMembers}**\n` +
                                `> *En ligne :* **${onlineMembers}**\n` +
                                `> *En vocal :* **${voiceMembers}**\n` +
                                `> *Boosts :* **${boosted}**`
                            )
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder({
                            media: {
                                url: iconURL || 'https://cdn.discordapp.com/embed/avatars/0.png'
                            }
                        })
                    )
            );

        await message.reply({
            components: [container],
            flags: 1 << 15
        });
    }
};
