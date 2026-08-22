const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
} = require('discord.js');

module.exports = {
    name: 'pic',
    description: 'Affiche la photo de profil d\'un membre mentionné',
    async execute(client, message, args) {
        await message.channel.sendTyping();
        const member = message.mentions.members.first();
        if (!member) return message.reply('❌ Mentionnez un utilisateur.');

        const avatarURL = member.user.displayAvatarURL({ dynamic: true, size: 512 });
        const container = new ContainerBuilder().setAccentColor(member.displayColor || 0x5865F2);

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## 🖼️ Photo de profil — ${member.user.tag}`)
        );
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1));
        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder().setURL(avatarURL).setDescription(member.user.tag)
            )
        );
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# [Lien direct](${avatarURL})`)
        );

        message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
};
