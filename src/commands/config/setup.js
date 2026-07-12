const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
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
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Permission requise.');
        }

        let page = 'general';

        const pages = {
            general: '📌 Général',
            security: '🛡️ Sécurité',
            moderation: '⚠️ Modération',
            tickets: '🎫 Tickets',
            giveaway: '🎉 Giveaways',
            logs: '📜 Logs',
            admin: '👑 Administration'
        };

        function createContainer() {
            const config = guildConfig.getAll(message.guild.id);

            const container = new ContainerBuilder()
                .setAccentColor(0x5865F2);

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`## ⚙️ Configuration — ${message.guild.name}`)
            );

            container.addSeparatorComponents(
                new SeparatorBuilder()
            );

            let content = '';

            if (page === 'general') {
                content =
`### 📌 Configuration générale

> **Préfixe :** \`${config.prefix}\`
> **Salon bienvenue :** ${config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : '❌ Non configuré'}
> **Salon logs principal :** ${config.logChannelId ? `<#${config.logChannelId}>` : '❌ Non configuré'}
> **Rôle soutien :** ${config.soutienRoleId ? `<@&${config.soutienRoleId}>` : '❌ Non configuré'}
> **Statut soutien :** ${config.soutienStatut || '❌ Aucun'}

### 🌐 Serveur

> **Description :** ${config.serverDescription || '❌ Non configurée'}
> **Backup :** ${config.backupLink || '❌ Aucun'}`;
            }

            if (page === 'security') {
                const ar = config.antiraidConfig;

                content =
`### 🛡️ Sécurité

> **Anti-Raid :** ${config.antiraidEnabled ? '✅ Activé' : '❌ Désactivé'}
> **Captcha :** ${config.captchaEnabled ? '✅ Activé' : '❌ Désactivé'}

### 💬 Anti-Spam

> **Limite :** ${ar.spamLimit} messages
> **Intervalle :** ${ar.spamInterval}ms
> **Mute :** ${ar.muteDuration} minutes

### 👥 Anti-Join Raid

> **Limite :** ${ar.joinLimit} membres
> **Intervalle :** ${ar.joinInterval / 1000}s

> **Invitations désactivées :** ${ar.disableInvites ? '✅' : '❌'}`;
            }

            if (page === 'moderation') {
                content =
`### ⚠️ Modération

> **Rôle mute :** ${config.muteRoleId ? `<@&${config.muteRoleId}>` : '❌ Non configuré'}

### Warns

> **Rôles autorisés :** ${
    config.warnRoles.length
        ? config.warnRoles.map(id => `<@&${id}>`).join(', ')
        : '❌ Aucun'
}`;
            }

            if (page === 'tickets') {
                const t = config.ticketConfig;

                content =
`### 🎫 Tickets

> **Description panel :** ${t.panelDescription}

> **Couleur :** \`${t.panelColor}\`
> **Salon logs :** ${t.logChannelId ? `<#${t.logChannelId}>` : '❌ Aucun'}
> **Tickets créés :** ${t.ticketCount}

### Catégories

${
    t.categories.length
        ? t.categories.map(c => `> ${c.name || 'Sans nom'}`).join('\n')
        : '> ❌ Aucune catégorie'
}`;
            }

            if (page === 'giveaway') {
                const g = config.giveawayConfig;

                content =
`### 🎉 Giveaways

> **Salon par défaut :** ${g.defaultChannelId ? `<#${g.defaultChannelId}>` : '❌ Aucun'}
> **Gagnants par défaut :** ${g.defaultWinners}
> **Couleur :** \`${g.defaultColor}\`

### Gestionnaires

${
    g.managerRoles.length
        ? g.managerRoles.map(id => `> <@&${id}>`).join('\n')
        : '> ❌ Aucun rôle'
}`;
            }

            if (page === 'logs') {
                const l = config.logChannels;

                content =
`### 📜 Logs

> 👤 Membres : ${l.member ? `<#${l.member}>` : '❌'}
> 💬 Messages : ${l.messages ? `<#${l.messages}>` : '❌'}
> 🎤 Vocal : ${l.voice ? `<#${l.voice}>` : '❌'}
> 🎭 Rôles : ${l.roles ? `<#${l.roles}>` : '❌'}
> 🚀 Boost : ${l.boost ? `<#${l.boost}>` : '❌'}
> 📁 Salons : ${l.channels ? `<#${l.channels}>` : '❌'}
> 🔨 Modération : ${l.moderation ? `<#${l.moderation}>` : '❌'}
> 🏠 Serveur : ${l.server ? `<#${l.server}>` : '❌'}`;
            }

            if (page === 'admin') {
                content =
`### 👑 Administration

### Owners Bot

${
    config.botOwners.length
        ? config.botOwners.map(id => `> <@${id}>`).join('\n')
        : '> ❌ Aucun owner configuré'
}`;
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
                    .setContent(`-# ${pages[page]} · Configuration`)
            );

            return container;
        }

        function createComponents() {
            return [
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('setup_menu')
                        .setPlaceholder('Choisir une catégorie')
                        .addOptions(
                            Object.entries(pages).map(([value, label]) => ({
                                label: label.replace(/^[^ ]+ /, ''),
                                value,
                                emoji: label.split(' ')[0]
                            }))
                        )
                ),

                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('setup_refresh')
                        .setLabel('Actualiser')
                        .setEmoji('🔄')
                        .setStyle(ButtonStyle.Secondary)
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
                    content: '❌ Ce panneau ne vous appartient pas.',
                    flags: MessageFlags.Ephemeral
                });
            }

            if (interaction.customId === 'setup_menu') {
                page = interaction.values[0];
            }

            await interaction.update({
                components: [
                    createContainer(),
                    ...createComponents()
                ],
                flags: MessageFlags.IsComponentsV2
            });
        });
    }
};
