const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("steam")
        .setDescription("Recherche un jeu sur Steam (Components V2)")
        .addStringOption(option =>
            option
                .setName("jeu")
                .setDescription("Nom du jeu à rechercher")
                .setRequired(true)
        ),

    async execute(interaction) {
        const query = interaction.options.getString("jeu").trim();

        try {
            const searchRes = await fetch(
                `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=fr&cc=fr`
            );

            const search = await searchRes.json();
            const items = search?.items;

            if (!Array.isArray(items) || items.length === 0) {
                return interaction.reply({
                    content: "❌ Aucun résultat trouvé.",
                    ephemeral: true
                });
            }

            const game = items.find(i => i?.id || i?.appid) || items[0];
            const appid = game.id || game.appid;

            if (!appid) {
                return interaction.reply({
                    content: "❌ AppID introuvable.",
                    ephemeral: true
                });
            }

            const detailsRes = await fetch(
                `https://store.steampowered.com/api/appdetails?appids=${appid}&l=fr`
            );

            const details = await detailsRes.json();
            const app = details?.[appid];

            if (!app?.success || !app?.data) {
                return interaction.reply({
                    content: "❌ Impossible de récupérer les infos.",
                    ephemeral: true
                });
            }

            const data = app.data;

            const price = data.price_overview
                ? `${(data.price_overview.final / 100).toFixed(2)}€`
                : "Gratuit";

            const platforms = [];

            if (data.platforms?.windows) platforms.push("Windows");
            if (data.platforms?.mac) platforms.push("Mac");
            if (data.platforms?.linux) platforms.push("Linux");

            const container = new ContainerBuilder()
                .setAccentColor(0x2f3136);

            if (game?.tiny_image) {
                container.addMediaGalleryComponents(
                    gallery =>
                        gallery.addItems(
                            item => item.setURL(game.tiny_image)
                        )
                );
            }

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 🎮 ${data.name}`
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `💰 **Prix :** ${price}\n` +
                    `🖥️ **Plateformes :** ${platforms.join(", ") || "Aucune"}\n` +
                    `📅 **Sortie :** ${data.release_date?.date || "Inconnue"}`
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(1)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `### 📝 Description\n${data.short_description || "Aucune description."}`
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `📦 Dev: ${data.developers?.join(", ") || "N/A"}\n` +
                    `🏢 Éditeur: ${data.publishers?.join(", ") || "N/A"}`
                )
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `-# 🔗 https://store.steampowered.com/app/${appid}`
                )
            );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("🔗 Steam")
                    .setStyle(ButtonStyle.Link)
                    .setURL(
                        `https://store.steampowered.com/app/${appid}`
                    )
            );

            return interaction.reply({
                components: [container, row],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (err) {
            console.error(err);

            return interaction.reply({
                content: "❌ Erreur Steam.",
                ephemeral: true
            });
        }
    }
};