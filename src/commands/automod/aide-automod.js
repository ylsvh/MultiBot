const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');

const PAGES = {
    accueil: {
        title: '🛡️ AutoMod — Centre d’aide',
        content:
            `> Configurez et comprenez chaque module de protection du serveur.\n` +
            `> Sélectionnez une catégorie dans le menu pour afficher les commandes disponibles.\n\n` +

            `**Modules**\n` +
            `> 🔗 Anti-invitations\n` +
            `> 🌐 Anti-liens\n` +
            `> 🚫 Anti-mots\n` +
            `> 📨 Anti-spam\n` +
            `> 🔠 Anti-majuscules\n` +
            `> 📢 Anti-mentions`
    },

    general: {
        title: '⚙️ Commandes générales',
        content:
            `> Ces commandes sont communes à tous les modules AutoMod.\n\n` +

            `**Activation**\n` +
            `> \`+automod <module> on\`\n` +
            `> \`+automod <module> off\`\n\n` +

            `**Sanction**\n` +
            `> \`+automod <module> action delete\`\n` +
            `> \`+automod <module> action warn\`\n` +
            `> \`+automod <module> action mute\`\n` +
            `> \`+automod <module> action kick\`\n` +
            `> \`+automod <module> action ban\`\n\n` +

            `**Actions**\n` +
            `> 🗑️ Suppression du message\n` +
            `> ⚠️ Suppression + avertissement\n` +
            `> 🔇 Suppression + mute 10 minutes\n` +
            `> 👢 Suppression + expulsion\n` +
            `> 🔨 Suppression + bannissement`
    },

    whitelist: {
        title: '🛡️ Exemptions',
        content:
            `> Les exemptions permettent d'ignorer un module pour certains rôles, salons ou membres.\n\n` +

            `**Rôle**\n` +
            `> \`+automod <module> whitelist role add @role\`\n` +
            `> \`+automod <module> whitelist role remove @role\`\n\n` +

            `**Salon**\n` +
            `> \`+automod <module> whitelist channel add #salon\`\n` +
            `> \`+automod <module> whitelist channel remove #salon\`\n\n` +

            `**Membre**\n` +
            `> \`+automod <module> whitelist user add @membre\`\n` +
            `> \`+automod <module> whitelist user remove @membre\`\n\n` +

            `**Réinitialisation**\n` +
            `> \`+automod <module> whitelist clear\``
    },

    manager: {
        title: '👮 Gestion des modules',
        content:
            `> Les rôles gestionnaires peuvent configurer un module sans posséder les permissions Administrateur.\n\n` +

            `**Ajouter un rôle**\n` +
            `> \`+automod <module> manager add @role\`\n\n` +

            `**Retirer un rôle**\n` +
            `> \`+automod <module> manager remove @role\`\n\n` +

            `**Accès automatique**\n` +
            `> Les administrateurs et les membres possédant **Gérer le serveur** peuvent gérer l'AutoMod.`
    },

    antiinvite: {
        title: '🔗 Anti-invitations',
        content:
            `> Bloque les invitations vers des serveurs Discord envoyées dans les messages.\n\n` +

            `**Activer**\n` +
            `> \`+automod antiinvite on\`\n\n` +

            `**Désactiver**\n` +
            `> \`+automod antiinvite off\`\n\n` +

            `**Choisir la sanction**\n` +
            `> \`+automod antiinvite action delete\`\n` +
            `> \`+automod antiinvite action warn\`\n` +
            `> \`+automod antiinvite action mute\`\n` +
            `> \`+automod antiinvite action kick\`\n` +
            `> \`+automod antiinvite action ban\``
    },

    antilink: {
        title: '🌐 Anti-liens',
        content:
            `> Détecte les URLs envoyées dans les messages.\n\n` +

            `**Activer**\n` +
            `> \`+automod antilink on\`\n\n` +

            `**Désactiver**\n` +
            `> \`+automod antilink off\`\n\n` +

            `**Choisir la sanction**\n` +
            `> \`+automod antilink action delete\`\n` +
            `> \`+automod antilink action warn\`\n` +
            `> \`+automod antilink action mute\`\n` +
            `> \`+automod antilink action kick\`\n` +
            `> \`+automod antilink action ban\``
    },

    antiwords: {
        title: '🚫 Anti-mots',
        content:
            `> Bloque automatiquement les mots et expressions présents dans la liste noire.\n\n` +

            `**Ajouter**\n` +
            `> \`+automod antiwords add mot1, mot2, expression\`\n\n` +

            `**Supprimer**\n` +
            `> \`+automod antiwords remove mot\`\n\n` +

            `**Afficher la liste**\n` +
            `> \`+automod antiwords list\`\n\n` +

            `**Vider la liste**\n` +
            `> \`+automod antiwords clear\`\n\n` +

            `**Activation**\n` +
            `> \`+automod antiwords on\`\n\n` +

            `**Sanctions**\n` +
            `> \`+automod antiwords action <delete|warn|mute|kick|ban>\``
    },

    antispam: {
        title: '📨 Anti-spam',
        content:
            `> Détecte les envois répétés et les messages identiques envoyés rapidement.\n\n` +

            `**Nombre de messages**\n` +
            `> \`+automod antispam limit 5\`\n\n` +

            `**Intervalle**\n` +
            `> \`+automod antispam interval 5000\`\n\n` +

            `**Messages identiques**\n` +
            `> \`+automod antispam duplicates 3\`\n\n` +

            `**Activation**\n` +
            `> \`+automod antispam on\`\n\n` +

            `**Sanction**\n` +
            `> \`+automod antispam action <delete|warn|mute|kick|ban>\``
    },

    anticaps: {
        title: '🔠 Anti-majuscules',
        content:
            `> Détecte les messages contenant une proportion excessive de majuscules.\n\n` +

            `**Longueur minimale**\n` +
            `> \`+automod anticaps minimum 10\`\n\n` +

            `**Seuil de majuscules**\n` +
            `> \`+automod anticaps percentage 70\`\n\n` +

            `**Activation**\n` +
            `> \`+automod anticaps on\`\n\n` +

            `**Sanction**\n` +
            `> \`+automod anticaps action <delete|warn|mute|kick|ban>\``
    },

    antimention: {
        title: '📢 Anti-mentions',
        content:
            `> Limite le nombre de membres et de rôles mentionnés dans un même message.\n\n` +

            `**Mentions de membres**\n` +
            `> \`+automod antimention users 5\`\n\n` +

            `**Mentions de rôles**\n` +
            `> \`+automod antimention roles 3\`\n\n` +

            `**Mentions totales**\n` +
            `> \`+automod antimention total 5\`\n\n` +

            `**Activation**\n` +
            `> \`+automod antimention on\`\n\n` +

            `**Sanction**\n` +
            `> \`+automod antimention action <delete|warn|mute|kick|ban>\``
    }
};

function buildContainer(pageKey) {
    const page = PAGES[pageKey] || PAGES.accueil;

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${page.title}`)
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
            .setSpacing(2)
            .setDivider(true)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(page.content)
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
            .setSpacing(2)
            .setDivider(true)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            '-# Sélectionnez une catégorie ci-dessous pour continuer.'
        )
    );

    return container;
}

function buildMenu(current) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId('automod_help_menu')
        .setPlaceholder('Sélectionner une catégorie')
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('Accueil')
                .setDescription('Présentation du système AutoMod')
                .setValue('accueil')
                .setEmoji('🛡️')
                .setDefault(current === 'accueil'),

            new StringSelectMenuOptionBuilder()
                .setLabel('Commandes générales')
                .setDescription('Activation et sanctions')
                .setValue('general')
                .setEmoji('⚙️')
                .setDefault(current === 'general'),

            new StringSelectMenuOptionBuilder()
                .setLabel('Exemptions')
                .setDescription('Rôles, salons et membres')
                .setValue('whitelist')
                .setEmoji('🛡️')
                .setDefault(current === 'whitelist'),

            new StringSelectMenuOptionBuilder()
                .setLabel('Gestionnaires')
                .setDescription('Rôles autorisés à gérer les modules')
                .setValue('manager')
                .setEmoji('👮')
                .setDefault(current === 'manager'),

            new StringSelectMenuOptionBuilder()
                .setLabel('Anti-invitations')
                .setDescription('Bloquer les invitations Discord')
                .setValue('antiinvite')
                .setEmoji('🔗')
                .setDefault(current === 'antiinvite'),

            new StringSelectMenuOptionBuilder()
                .setLabel('Anti-liens')
                .setDescription('Bloquer les URLs')
                .setValue('antilink')
                .setEmoji('🌐')
                .setDefault(current === 'antilink'),

            new StringSelectMenuOptionBuilder()
                .setLabel('Anti-mots')
                .setDescription('Gérer la liste noire')
                .setValue('antiwords')
                .setEmoji('🚫')
                .setDefault(current === 'antiwords'),

            new StringSelectMenuOptionBuilder()
                .setLabel('Anti-spam')
                .setDescription('Détecter les messages répétitifs')
                .setValue('antispam')
                .setEmoji('📨')
                .setDefault(current === 'antispam'),

            new StringSelectMenuOptionBuilder()
                .setLabel('Anti-majuscules')
                .setDescription('Limiter les majuscules abusives')
                .setValue('anticaps')
                .setEmoji('🔠')
                .setDefault(current === 'anticaps'),

            new StringSelectMenuOptionBuilder()
                .setLabel('Anti-mentions')
                .setDescription('Limiter les mentions massives')
                .setValue('antimention')
                .setEmoji('📢')
                .setDefault(current === 'antimention')
        );

    return new ActionRowBuilder().addComponents(menu);
}

module.exports = {
    name: 'aide-automod',
    description: 'Affiche l’aide du système AutoMod',

    async execute(client, message) {
        await message.channel.sendTyping();

        if (!message.member?.permissions.has('Administrator')) {
            return message.reply(
                '❌ Cette commande est réservée aux administrateurs.'
            );
        }

        let currentPage = 'accueil';

        const sent = await message.channel.send({
            components: [
                buildContainer(currentPage),
                buildMenu(currentPage)
            ],
            flags: MessageFlags.IsComponentsV2
        });

        const collector = sent.createMessageComponentCollector({
            time: 10 * 60 * 1000
        });

        collector.on('collect', async interaction => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({
                    content: '❌ Cette aide ne vous appartient pas.',
                    flags: MessageFlags.Ephemeral
                });
            }

            if (interaction.customId !== 'automod_help_menu') return;

            currentPage = interaction.values[0];

            await interaction.update({
                components: [
                    buildContainer(currentPage),
                    buildMenu(currentPage)
                ],
                flags: MessageFlags.IsComponentsV2
            });
        });

        collector.on('end', async () => {
            const menu = buildMenu(currentPage);
            menu.components[0].setDisabled(true);

            await sent.edit({
                components: [
                    buildContainer(currentPage),
                    menu
                ],
                flags: MessageFlags.IsComponentsV2
            }).catch(() => {});
        });
    }
};