const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    name: 'fortnite',
    aliases: ['fnshop', 'fortniteshop', 'shopfn'],
    usage: 'fortnite',
    description: 'Affiche la boutique Fortnite du jour.',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        try {
            const response = await fetch(
                'https://raw.githubusercontent.com/Fortnite-Datamining/Fortnite-Datamining/main/data/shop/current.json',
                {
                    headers: {
                        'User-Agent': 'Noob-Discord-Bot'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`API Fortnite : ${response.status}`);
            }

            const json = await response.json();
            const shop = json.data;

            if (!shop || !Array.isArray(shop.entries)) {
                throw new Error('Format de la boutique Fortnite invalide.');
            }

            const formatNumber = (number) => {
                return Number(number || 0).toLocaleString('fr-FR');
            };

            const shopDate = new Date(shop.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            /*
             * Regroupe les offres par section.
             */
            const sections = new Map();

            for (const entry of shop.entries) {
                const sectionName =
                    entry.layout?.name ||
                    entry.layout?.category ||
                    'Autres';

                if (!sections.has(sectionName)) {
                    sections.set(sectionName, []);
                }

                sections.get(sectionName).push(entry);
            }

            /*
             * Trie les sections selon leur priorité d'affichage.
             */
            const sortedSections = [...sections.entries()]
                .sort((a, b) => {
                    const aRank = a[1][0]?.layout?.rank ?? 9999;
                    const bRank = b[1][0]?.layout?.rank ?? 9999;

                    return aRank - bRank;
                });

            const containers = [];

            /*
             * Premier message : informations générales.
             */
            const mainContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# 🛒 Boutique Fortnite\n\n` +
                        `**Boutique du :** ${shopDate}\n` +
                        `**Offres disponibles :** ${formatNumber(shop.entries.length)}\n\n` +
                        `Voici la boutique Fortnite actuellement disponible.`
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                );

            /*
             * On affiche les sections dans les containers.
             * Discord limite la taille d'un container, donc on
             * répartit automatiquement le contenu.
             */
            let currentContainer = mainContainer;
            let currentItems = 0;

            for (const [sectionName, entries] of sortedSections) {
                const sectionLines = [];

                for (const entry of entries) {
                    const item =
                        entry.brItems?.[0] ||
                        entry.instruments?.[0] ||
                        entry.tracks?.[0] ||
                        entry.cars?.[0] ||
                        entry.bundle ||
                        null;

                    let name = 'Article inconnu';
                    let type = '';
                    let rarity = '';

                    if (item) {
                        name =
                            item.name ||
                            item.title ||
                            item.displayName ||
                            'Article inconnu';

                        type =
                            item.type?.displayValue ||
                            item.type?.value ||
                            '';

                        rarity =
                            item.rarity?.displayValue ||
                            '';
                    }

                    if (entry.tracks?.[0]) {
                        name = entry.tracks[0].title || name;

                        if (entry.tracks[0].artist) {
                            name += ` — ${entry.tracks[0].artist}`;
                        }
                    }

                    if (entry.bundle) {
                        name = entry.bundle.name || name;
                    }

                    const price = entry.finalPrice ?? entry.regularPrice;

                    let line =
                        `• **${name}**`;

                    if (type) {
                        line += ` — ${type}`;
                    }

                    if (rarity) {
                        line += ` — ${rarity}`;
                    }

                    if (price !== undefined) {
                        line += ` — **${formatNumber(price)} V-Bucks**`;
                    }

                    sectionLines.push(line);
                }

                /*
                 * Une section trop grande est découpée.
                 */
                const chunks = [];

                for (let i = 0; i < sectionLines.length; i += 12) {
                    chunks.push(sectionLines.slice(i, i + 12));
                }

                for (const chunk of chunks) {
                    const content =
                        `## 🛍️ ${sectionName}\n\n` +
                        chunk.join('\n');

                    if (currentItems >= 4) {
                        containers.push(currentContainer);

                        currentContainer = new ContainerBuilder();
                        currentItems = 0;
                    }

                    currentContainer
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(content)
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder()
                        );

                    currentItems++;
                }
            }

            containers.push(currentContainer);

            /*
             * Maximum de 10 containers pour éviter une réponse
             * trop importante.
             */
            const displayedContainers = containers.slice(0, 10);

            const lastContainer =
                displayedContainers[displayedContainers.length - 1];

            lastContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `*Boutique récupérée le ${new Date().toLocaleString('fr-FR')}.*`
                )
            );

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Voir la boutique complète')
                        .setStyle(ButtonStyle.Link)
                        .setURL(
                            'https://www.fortnite.com/item-shop'
                        )
                );

            await message.reply({
                components: [
                    ...displayedContainers,
                    buttons
                ],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error('[FORTNITE] Erreur :', error);

            const errorContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '# ❌ Erreur\n\n' +
                        'Impossible de récupérer la boutique Fortnite actuellement.\n\n' +
                        `\`${error.message}\``
                    )
                );

            await message.reply({
                components: [errorContainer],
                flags: MessageFlags.IsComponentsV2
            });
        }
    }
};