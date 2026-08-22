const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ImageDisplayBuilder,
} = require("discord.js");

module.exports = {
    name: "steam",
    description: "Recherche un jeu sur Steam (Components V2)",

    async execute(client, message, args) {
        await message.channel.sendTyping();
        const fetch = globalThis.fetch;

        const query = (args || []).join(" ").trim();
        if (!query) return message.reply("❌ Utilisation: steam <nom du jeu>");

        try {
            const searchRes = await fetch(
                `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=fr&cc=fr`
            );

            const search = await searchRes.json();
            const items = search?.items;

            if (!Array.isArray(items) || items.length === 0) {
                return message.reply("❌ Aucun résultat trouvé.");
            }

            const game = items.find(i => i?.id || i?.appid) || items[0];
            const appid = game.id || game.appid;

            if (!appid) return message.reply("❌ AppID introuvable.");

            const detailsRes = await fetch(
                `https://store.steampowered.com/api/appdetails?appids=${appid}&l=fr`
            );

            const details = await detailsRes.json();
            const app = details?.[appid];

            if (!app?.success || !app?.data) {
                return message.reply("❌ Impossible de récupérer les infos.");
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
                        gallery.addItems(item =>
                            item.setURL(game.tiny_image)
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
                    .setURL(`https://store.steampowered.com/app/${appid}`)
            );

            return message.channel.send({
                components: [container, row],
                flags: MessageFlags.IsComponentsV2,
            });

        } catch (err) {
            console.error(err);
            return message.reply("❌ Erreur Steam.");
        }
    }
};