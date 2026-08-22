const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
} = require('discord.js');

module.exports = {
    name: 'cv2demo',
    description: 'Démo des Components V2 Discord (nouveau système de mise en page).',
    async execute(client, message, args) {
        await message.channel.sendTyping();
        const container = new ContainerBuilder()
            .setAccentColor(0x5865F2);

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent('## 🧩 Components V2 — Démonstration\nCe message est entièrement construit avec le **nouveau système de composants** Discord. Pas d\'embed, que des components !')
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(1).setDivider(true)
        );

        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '### 📌 Section\nUne **Section** place du texte à gauche et une miniature (ou un bouton) à droite. Utile pour des profils, des stats, etc.'
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder()
                        .setURL(message.author.displayAvatarURL({ size: 128 }))
                        .setDescription('Avatar de l\'auteur')
                )
        );

        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true));

        container.addMediaGalleryComponents(
            new MediaGalleryBuilder()
                .addItems(
                    new MediaGalleryItemBuilder()
                        .setURL('https://i.imgur.com/AfFp7pu.png')
                        .setDescription('Image 1'),
                    new MediaGalleryItemBuilder()
                        .setURL('https://i.imgur.com/KNoRiab.png')
                        .setDescription('Image 2')
                )
        );

        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1));

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent('> **💡 Astuce :** Les composants peuvent être combinés dans n\'importe quel ordre. TextDisplay, galerie, boutons, etc.')
        );

        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true));

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('cv2_primary').setLabel('Bouton Primaire').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('cv2_success').setLabel('Succès').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('cv2_danger').setLabel('Danger').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setLabel('Lien externe').setURL('https://discord.com/developers/docs').setStyle(ButtonStyle.Link)
            )
        );

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('cv2_select')
                    .setPlaceholder('Select menu dans un container...')
                    .addOptions(
                        { label: 'Option A', value: 'a', description: 'Première option' },
                        { label: 'Option B', value: 'b', description: 'Deuxième option' },
                        { label: 'Option C', value: 'c', description: 'Troisième option' }
                    )
            )
        );

        await message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
