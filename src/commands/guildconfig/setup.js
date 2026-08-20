const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    PermissionFlagsBits
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'setup',
    description: 'Panel complet de configuration du serveur',

    async execute(client, message) {
        await message.channel.sendTyping();

        if (!message.guild) return;

        if (
            !message.member.permissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {
            return message.reply(
                '❌ Vous devez être administrateur pour utiliser cette commande.'
            );
        }

        let page = 'general';

        const pages = {
            general: {
                label: 'Général',
                emoji: '📌'
            },
            welcome: {
                label: 'Bienvenue',
                emoji: '👋'
            },
            security: {
                label: 'Sécurité',
                emoji: '🛡️'
            },
            moderation: {
                label: 'Modération',
                emoji: '⚠️'
            },
            tickets: {
                label: 'Tickets',
                emoji: '🎫'
            },
            giveaway: {
                label: 'Giveaways',
                emoji: '🎉'
            },
            logs: {
                label: 'Logs',
                emoji: '📜'
            },
            points: {
                label: 'Points',
                emoji: '⭐'
            },
            admin: {
                label: 'Administration',
                emoji: '👑'
            }
        };

        function getConfig() {
            return guildConfig.getAll(message.guild.id) || {};
        }

        function channel(id) {
            return id ? `<#${id}>` : '❌ Non configuré';
        }

        function role(id) {
            return id ? `<@&${id}>` : '❌ Non configuré';
        }

        function enabled(value) {
            return value
                ? '🟢 Activé'
                : '🔴 Désactivé';
        }

        function value(value, fallback = '❌ Non configuré') {
            return value !== undefined &&
                value !== null &&
                value !== ''
                ? `\`${value}\``
                : fallback;
        }

        function createContainer() {
            const config = getConfig();

            const container = new ContainerBuilder()
                .setAccentColor(0x5865F2);

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# ⚙️ Configuration\n` +
                    `### ${message.guild.name}`
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder()
            );

            let content = '';

            /*
             * GÉNÉRAL
             */
            if (page === 'general') {
                content =
`## 📌 Configuration générale

### Serveur

> **Préfixe**  
> ${value(config.prefix, '`+`')}

> **Salon de bienvenue**  
> ${channel(config.welcomeChannelId)}

> **Salon de logs principal**  
> ${channel(config.logChannelId)}

> **Description du serveur**  
> ${config.serverDescription || '❌ Non configurée'}

### Soutien

> **Statut recherché**  
> ${config.soutienStatut
    ? `\`${config.soutienStatut}\``
    : '❌ Aucun'}

> **Rôle soutien**  
> ${role(config.soutienRoleId)}

### Autres

> **Backup**  
> ${config.backupLink || '❌ Aucun'}`;
            }

            /*
             * BIENVENUE
             */
            if (page === 'welcome') {
                content =
`## 👋 Bienvenue

### Message de bienvenue

> **Salon**  
> ${channel(config.welcomeChannelId)}

> **Message personnalisé**  
> ${config.welcomeMessage
    ? `> ${config.welcomeMessage}`
    : '❌ Aucun message personnalisé'}

> **Rôle automatique**  
> ${role(config.welcomeRoleId)}

> **Rôle ping**  
> ${role(config.welcomePingRoleId)}

### Variables disponibles

> \`{user}\` → mention du membre  
> \`{username}\` → nom d'utilisateur  
> \`{tag}\` → tag Discord  
> \`{server}\` → nom du serveur  
> \`{count}\` → nombre de membres`;
            }

            /*
             * SÉCURITÉ
             */
            if (page === 'security') {
                const ar = config.antiraidConfig || {};

                content =
`## 🛡️ Sécurité

### Protections

> **Anti-Raid**  
> ${enabled(config.antiraidEnabled)}

> **Captcha**  
> ${enabled(config.captchaEnabled)}

> **AntiEXE**  
> ${enabled(config.antiexe)}

> **Honeypot**  
> ${config.honeypotChannel
    ? `🟢 Activé — <#${config.honeypotChannel}>`
    : '🔴 Désactivé'}

### Anti-Spam

> **Limite**  
> ${value(ar.spamLimit, 'Aucune')}

> **Intervalle**  
> ${ar.spamInterval
    ? `\`${ar.spamInterval}ms\``
    : '❌ Non configuré'}

> **Mute**  
> ${ar.muteDuration
    ? `\`${ar.muteDuration} minutes\``
    : '❌ Non configuré'}

### Anti-Raid

> **Limite de joins**  
> ${value(ar.joinLimit, 'Aucune')}

> **Intervalle**  
> ${ar.joinInterval
    ? `\`${ar.joinInterval / 1000}s\``
    : '❌ Non configuré'}

> **Invitations**  
> ${ar.disableInvites
    ? '🔴 Désactivées'
    : '🟢 Autorisées'}`;
            }

            /*
             * MODÉRATION
             */
            if (page === 'moderation') {
                const warnRoles = Array.isArray(config.warnRoles)
                    ? config.warnRoles
                    : [];

                content =
`## ⚠️ Modération

### Sanctions

> **Rôle mute**  
> ${role(config.muteRoleId)}

> **Rôles autorisés pour les warns**  
> ${
    warnRoles.length
        ? warnRoles.map(id => `<@&${id}>`).join(', ')
        : '❌ Aucun'
}

### Système de sanctions

> **Warn** → avertissement  
> **Mute** → restriction temporaire  
> **Kick** → expulsion  
> **Ban** → bannissement`;
            }

            /*
             * TICKETS
             */
            if (page === 'tickets') {
                const t = config.ticketConfig || {};
                const categories = Array.isArray(t.categories)
                    ? t.categories
                    : [];

                content =
`## 🎫 Tickets

### Panel

> **Description**  
> ${t.panelDescription || '❌ Non configurée'}

> **Couleur**  
> ${t.panelColor
    ? `\`${t.panelColor}\``
    : '❌ Non configurée'}

> **Salon des logs**  
> ${channel(t.logChannelId)}

> **Tickets créés**  
> \`${t.ticketCount || 0}\`

### Catégories

${
    categories.length
        ? categories
            .map(c =>
                `> **${c.name || 'Sans nom'}** — ${c.categoryId ? `<#${c.categoryId}>` : '❌'}`
            )
            .join('\n')
        : '> ❌ Aucune catégorie configurée'
}`;
            }

            /*
             * GIVEAWAYS
             */
            if (page === 'giveaway') {
                const g = config.giveawayConfig || {};

                const managerRoles =
                    Array.isArray(g.managerRoles)
                        ? g.managerRoles
                        : [];

                content =
`## 🎉 Giveaways

### Configuration par défaut

> **Salon**  
> ${channel(g.defaultChannelId)}

> **Nombre de gagnants**  
> \`${g.defaultWinners || 1}\`

> **Couleur**  
> ${g.defaultColor
    ? `\`${g.defaultColor}\``
    : '❌ Non configurée'}

### Gestionnaires

${
    managerRoles.length
        ? managerRoles
            .map(id => `> <@&${id}>`)
            .join('\n')
        : '> ❌ Aucun rôle configuré'
}`;
            }

            /*
             * LOGS
             */
            if (page === 'logs') {
                const logs = config.logChannels || {};

                content =
`## 📜 Logs

> 👤 **Membres**  
> ${channel(logs.member)}

> 💬 **Messages**  
> ${channel(logs.messages)}

> 🎤 **Vocaux**  
> ${channel(logs.voice)}

> 🎭 **Rôles**  
> ${channel(logs.roles)}

> 🚀 **Boosts**  
> ${channel(logs.boost)}

> 📁 **Salons**  
> ${channel(logs.channels)}

> 🔨 **Modération**  
> ${channel(logs.moderation)}

> 🏠 **Serveur**  
> ${channel(logs.server)}`;
            }

            /*
             * POINTS
             */
            if (page === 'points') {
                const points = config.pointsConfig || {};

                content =
`## ⭐ Système de points

### Gains

> **Message**  
> \`${Number(points.messagePoints) || 0}\` point(s)

> **Commande**  
> \`${Number(points.commandPoints) || 0}\` point(s)

> **Vocal**  
> \`${Number(points.voicePoints) || 0}\` point(s)

### État

> **Système**  
> ${
    Number(points.messagePoints) > 0 ||
    Number(points.commandPoints) > 0 ||
    Number(points.voicePoints) > 0
        ? '🟢 Actif'
        : '🔴 Aucun gain configuré'
}`;
            }

            /*
             * ADMINISTRATION
             */
            if (page === 'admin') {
                const botOwners =
                    Array.isArray(config.botOwners)
                        ? config.botOwners
                        : [];

                content =
`## 👑 Administration

### Owners du bot

${
    botOwners.length
        ? botOwners
            .map(id => `> <@${id}>`)
            .join('\n')
        : '> ❌ Aucun owner supplémentaire configuré'
}

### Serveur

> **ID du serveur**  
> \`${message.guild.id}\`

> **Membres**  
> \`${message.guild.memberCount}\`

> **Propriétaire**  
> <@${message.guild.ownerId}>`;
            }

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(content)
            );

            container.addSeparatorComponents(
                new SeparatorBuilder()
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `-# ${pages[page].emoji} ${pages[page].label} · Actualisation automatique`
                    )
            );

            return container;
        }

        function createComponents() {
            const options = Object.entries(pages).map(
                ([value, data]) => ({
                    label: data.label,
                    value,
                    emoji: data.emoji,
                    default: page === value
                })
            );

            return [
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('setup_menu')
                        .setPlaceholder('Sélectionner une catégorie')
                        .addOptions(options)
                ),

                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('setup_refresh')
                        .setLabel('Actualiser')
                        .setEmoji('🔄')
                        .setStyle(ButtonStyle.Secondary),

                    new ButtonBuilder()
                        .setCustomId('setup_close')
                        .setLabel('Fermer')
                        .setEmoji('✖️')
                        .setStyle(ButtonStyle.Danger)
                )
            ];
        }

        const msg = await message.channel.send({
            components: [
                createContainer(),
                ...createComponents()
            ],
            flags: MessageFlags.IsComponentsV2
        });

        const collector = msg.createMessageComponentCollector({
            time: 300000
        });

        collector.on('collect', async interaction => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({
                    content:
                        '❌ Vous ne pouvez pas utiliser ce panneau.',
                    flags: MessageFlags.Ephemeral
                });
            }

            if (
                !interaction.member.permissions.has(
                    PermissionFlagsBits.Administrator
                )
            ) {
                return interaction.reply({
                    content:
                        '❌ Vous devez être administrateur.',
                    flags: MessageFlags.Ephemeral
                });
            }

            if (interaction.customId === 'setup_menu') {
                page = interaction.values[0];

                return interaction.update({
                    components: [
                        createContainer(),
                        ...createComponents()
                    ],
                    flags: MessageFlags.IsComponentsV2
                });
            }

            if (interaction.customId === 'setup_refresh') {
                return interaction.update({
                    components: [
                        createContainer(),
                        ...createComponents()
                    ],
                    flags: MessageFlags.IsComponentsV2
                });
            }

            if (interaction.customId === 'setup_close') {
                collector.stop('closed');

                return interaction.update({
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(0xED4245)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent(
                                        '# ⚙️ Configuration\n\n' +
                                        '❌ Le panneau de configuration a été fermé.'
                                    )
                            )
                    ],
                    flags: MessageFlags.IsComponentsV2
                });
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'closed') return;

            try {
                await msg.edit({
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(0x5865F2)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent(
                                        '# ⚙️ Configuration\n\n' +
                                        '⏱️ Ce panneau de configuration a expiré.\n' +
                                        'Utilisez `+setup` pour en ouvrir un nouveau.'
                                    )
                            )
                    ],
                    flags: MessageFlags.IsComponentsV2
                });
            } catch {}
        });
    }
};