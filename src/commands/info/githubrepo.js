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
    name: 'githubrepo',
    aliases: ['repo', 'github'],
    usage: 'githubrepo <pseudo/nom-repo | lien>',
    description: 'Affiche les informations d’un dépôt GitHub.',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        if (!args.length) {
            return message.reply({
                content: `${message.author}, veuillez indiquer un dépôt GitHub.\nExemple : \`+githubrepo discordjs/discord.js\``
            });
        }

        const repository = args[0].trim();

        try {
            let apiUrl;

            if (
                repository.startsWith('https://github.com/') ||
                repository.startsWith('http://github.com/')
            ) {
                const url = new URL(repository);

                if (
                    url.hostname !== 'github.com' &&
                    url.hostname !== 'www.github.com'
                ) {
                    return message.reply({
                        content: `${message.author}, le lien fourni n'est pas un lien GitHub valide.`
                    });
                }

                const path = url.pathname
                    .replace(/^\/+|\/+$/g, '')
                    .split('/');

                if (path.length < 2 || !path[0] || !path[1]) {
                    return message.reply({
                        content: `${message.author}, le lien GitHub ne contient pas de dépôt valide.`
                    });
                }

                apiUrl = `https://api.github.com/repos/${encodeURIComponent(path[0])}/${encodeURIComponent(path[1])}`;
            } else {
                const parts = repository.split('/');

                if (parts.length !== 2 || !parts[0] || !parts[1]) {
                    return message.reply({
                        content:
                            `${message.author}, format invalide.\n` +
                            `Utilisez \`pseudo/nom-repo\` ou un lien GitHub.`
                    });
                }

                apiUrl =
                    `https://api.github.com/repos/` +
                    `${encodeURIComponent(parts[0])}/` +
                    `${encodeURIComponent(parts[1])}`;
            }

            const response = await fetch(apiUrl, {
                headers: {
                    Accept: 'application/vnd.github+json',
                    'User-Agent': 'Noob-Discord-Bot'
                }
            });

            if (response.status === 404) {
                return message.reply({
                    content: `${message.author}, ce dépôt GitHub n'existe pas ou est privé.`
                });
            }

            if (!response.ok) {
                throw new Error(`GitHub API : ${response.status}`);
            }

            const repo = await response.json();

            const formatNumber = (number) => {
                return Number(number || 0).toLocaleString('fr-FR');
            };

            const language = repo.language || 'Aucun langage renseigné';
            const license = repo.license?.name || 'Aucune licence';

            const createdAt = new Date(repo.created_at)
                .toLocaleDateString('fr-FR');

            const updatedAt = new Date(repo.updated_at)
                .toLocaleDateString('fr-FR');

            const description = repo.description || 'Aucune description.';

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# GitHub — ${repo.full_name}\n\n` +
                        `${description}`
                    )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## Informations\n\n` +
                        `**Propriétaire :** [${repo.owner.login}](${repo.owner.html_url})\n` +
                        `**Langage principal :** ${language}\n` +
                        `**Licence :** ${license}\n` +
                        `**Créé le :** ${createdAt}\n` +
                        `**Dernière mise à jour :** ${updatedAt}\n` +
                        `**Branche principale :** \`${repo.default_branch}\``
                    )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## Statistiques\n\n` +
                        `⭐ **Stars :** ${formatNumber(repo.stargazers_count)}\n` +
                        `🍴 **Forks :** ${formatNumber(repo.forks_count)}\n` +
                        `👁️ **Watchers :** ${formatNumber(repo.watchers_count)}\n` +
                        `🐛 **Issues ouvertes :** ${formatNumber(repo.open_issues_count)}\n` +
                        `📦 **Taille :** ${formatNumber(repo.size)} KB`
                    )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## URLs\n\n` +
                        `**Dépôt :** ${repo.html_url}\n` +
                        `**Clone HTTPS :** \`${repo.clone_url}\`\n` +
                        `**Clone SSH :** \`${repo.ssh_url}\``
                    )
                );

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Voir le dépôt')
                        .setStyle(ButtonStyle.Link)
                        .setURL(repo.html_url),

                    new ButtonBuilder()
                        .setLabel('Voir le propriétaire')
                        .setStyle(ButtonStyle.Link)
                        .setURL(repo.owner.html_url)
                );

            await message.reply({
                components: [
                    container,
                    buttons
                ],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error('[GITHUBREPO] Erreur :', error);

            const errorContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '# ❌ Erreur\n\n' +
                        'Une erreur est survenue lors de la récupération ' +
                        'des informations du dépôt GitHub.'
                    )
                );

            await message.reply({
                components: [errorContainer],
                flags: MessageFlags.IsComponentsV2
            });
        }
    }
};