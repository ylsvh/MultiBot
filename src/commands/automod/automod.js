const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

const {
    getAutomod,
    MODULE_INFO,
    ACTION_LABELS,
    ACTIONS,
    isManager
} = require('../../utils/automodConfig');

module.exports = {
    name: 'automod',
    description: 'Configure le système AutoMod',

    async execute(client, message, args) {
        await message.channel.sendTyping();

        if (!message.member.permissions.has('Administrator')) {
            return message.reply(
                '❌ Cette commande est réservée aux administrateurs.'
            );
        }

        const guildId = message.guild.id;
        const prefix = guildConfig.get(guildId, 'prefix') || '+';
        const automod = getAutomod(guildId);

        const moduleName = args[0]?.toLowerCase();

        if (!moduleName) {
            const container = new ContainerBuilder()
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '## 🛡️ Configuration AutoMod'
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing(1)
                    .setDivider(true)
            );

            const modules = Object.entries(MODULE_INFO)
                .map(([name, info]) => {
                    const mod = automod[name];

                    return (
                        `${info.emoji} **${info.label}**\n` +
                        `-# ${mod.enabled ? '🟢 Activé' : '🔴 Désactivé'} · ${info.description}`
                    );
                })
                .join('\n\n');

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(modules)
            );

            container.addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing(1)
                    .setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `Utilisation : \`${prefix}automod <module>\`\n` +
                    `Modules disponibles : ${Object.keys(MODULE_INFO)
                        .map(name => `\`${name}\``)
                        .join(' · ')}`
                )
            );

            return message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (!MODULE_INFO[moduleName]) {
            return message.reply(
                `❌ Module inconnu.\n\nModules disponibles : ${Object.keys(MODULE_INFO)
                    .map(name => `\`${name}\``)
                    .join(' · ')}`
            );
        }

        const mod = automod[moduleName];
        const sub = args[1]?.toLowerCase();

        if (!sub || sub === 'config') {
            const info = MODULE_INFO[moduleName];

            const container = new ContainerBuilder()
                .setAccentColor(
                    mod.enabled ? 0x57F287 : 0xED4245
                );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${info.emoji} ${info.label}`
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing(1)
                    .setDivider(true)
            );

            let content =
                `**Statut**\n${mod.enabled ? '🟢 Activé' : '🔴 Désactivé'}\n\n` +
                `**Action**\n${ACTION_LABELS[mod.action] || mod.action}`;

            if (moduleName === 'antiwords') {
                content +=
                    `\n\n**Mots interdits**\n` +
                    `${mod.words?.length || 0} mot(s) configuré(s)`;
            }

            if (moduleName === 'antispam') {
                content +=
                    `\n\n**Limite**\n${mod.maxMessages} messages / ${mod.interval} ms\n\n` +
                    `**Doublons**\n${mod.duplicateLimit}`;
            }

            if (moduleName === 'anticaps') {
                content +=
                    `\n\n**Longueur minimale**\n${mod.minimumLength} caractères\n\n` +
                    `**Seuil**\n${mod.percentage}%`;
            }

            if (moduleName === 'antimention') {
                content +=
                    `\n\n**Mentions membres**\n${mod.maxUsers}\n\n` +
                    `**Mentions rôles**\n${mod.maxRoles}\n\n` +
                    `**Mentions totales**\n${mod.maxTotal}`;
            }

            const roles = mod.whitelistRoles?.length
                ? mod.whitelistRoles.map(id => `<@&${id}>`).join(', ')
                : 'Aucun';

            const channels = mod.whitelistChannels?.length
                ? mod.whitelistChannels.map(id => `<#${id}>`).join(', ')
                : 'Aucun';

            const users = mod.whitelistUsers?.length
                ? mod.whitelistUsers.map(id => `<@${id}>`).join(', ')
                : 'Aucun';

            content +=
                `\n\n**Exemptions**\n` +
                `Rôles : ${roles}\n` +
                `Salons : ${channels}\n` +
                `Membres : ${users}`;

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(content)
            );

            container.addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing(1)
                    .setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `-# \`${prefix}automod ${moduleName} on\` · ` +
                    `\`${prefix}automod ${moduleName} off\` · ` +
                    `\`${prefix}aide-automod\``
                )
            );

            return message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (sub === 'on' || sub === 'off') {
            mod.enabled = sub === 'on';

            guildConfig.setNested(
                guildId,
                'automod',
                moduleName,
                mod
            );

            return message.reply(
                `✅ **${MODULE_INFO[moduleName].label}** ${mod.enabled ? 'activé' : 'désactivé'}.`
            );
        }

        if (sub === 'action') {
            const action = args[2]?.toLowerCase();

            if (!ACTIONS.includes(action)) {
                return message.reply(
                    `❌ Action invalide.\n\nDisponibles : ${ACTIONS
                        .map(a => `\`${a}\``)
                        .join(' · ')}`
                );
            }

            mod.action = action;

            guildConfig.setNested(
                guildId,
                'automod',
                moduleName,
                mod
            );

            return message.reply(
                `✅ Action définie sur **${ACTION_LABELS[action]}**.`
            );
        }

        if (sub === 'whitelist') {
            const type = args[2]?.toLowerCase();
            const action = args[3]?.toLowerCase();

            if (type === 'clear') {
                mod.whitelistRoles = [];
                mod.whitelistChannels = [];
                mod.whitelistUsers = [];

                guildConfig.setNested(
                    guildId,
                    'automod',
                    moduleName,
                    mod
                );

                return message.reply(
                    '✅ Toutes les exemptions ont été supprimées.'
                );
            }

            if (type === 'role') {
                const role = message.mentions.roles.first();

                if (!role) {
                    return message.reply(
                        `❌ Utilisation : \`${prefix}automod ${moduleName} whitelist role add @role\``
                    );
                }

                if (action === 'add') {
                    if (!mod.whitelistRoles.includes(role.id)) {
                        mod.whitelistRoles.push(role.id);
                    }
                } else if (action === 'remove' || action === 'rm') {
                    mod.whitelistRoles =
                        mod.whitelistRoles.filter(id => id !== role.id);
                } else {
                    return message.reply(
                        '❌ Utilisez `add` ou `remove`.'
                    );
                }
            } else if (type === 'channel') {
                const channel = message.mentions.channels.first();

                if (!channel) {
                    return message.reply(
                        `❌ Utilisation : \`${prefix}automod ${moduleName} whitelist channel add #salon\``
                    );
                }

                if (action === 'add') {
                    if (!mod.whitelistChannels.includes(channel.id)) {
                        mod.whitelistChannels.push(channel.id);
                    }
                } else if (action === 'remove' || action === 'rm') {
                    mod.whitelistChannels =
                        mod.whitelistChannels.filter(id => id !== channel.id);
                } else {
                    return message.reply(
                        '❌ Utilisez `add` ou `remove`.'
                    );
                }
            } else if (type === 'user') {
                const user = message.mentions.users.first();

                if (!user) {
                    return message.reply(
                        `❌ Utilisation : \`${prefix}automod ${moduleName} whitelist user add @membre\``
                    );
                }

                if (action === 'add') {
                    if (!mod.whitelistUsers.includes(user.id)) {
                        mod.whitelistUsers.push(user.id);
                    }
                } else if (action === 'remove' || action === 'rm') {
                    mod.whitelistUsers =
                        mod.whitelistUsers.filter(id => id !== user.id);
                } else {
                    return message.reply(
                        '❌ Utilisez `add` ou `remove`.'
                    );
                }
            } else {
                return message.reply(
                    '❌ Type d\'exemption invalide : `role`, `channel`, `user` ou `clear`.'
                );
            }

            guildConfig.setNested(
                guildId,
                'automod',
                moduleName,
                mod
            );

            return message.reply(
                '✅ Exemptions mises à jour.'
            );
        }

        if (sub === 'manager') {
            const action = args[2]?.toLowerCase();
            const role = message.mentions.roles.first();

            if (!role) {
                return message.reply(
                    `❌ Utilisation : \`${prefix}automod ${moduleName} manager add @role\``
                );
            }

            if (action === 'add') {
                if (!mod.managerRoles.includes(role.id)) {
                    mod.managerRoles.push(role.id);
                }
            } else if (action === 'remove' || action === 'rm') {
                mod.managerRoles =
                    mod.managerRoles.filter(id => id !== role.id);
            } else {
                return message.reply(
                    '❌ Utilisez `add` ou `remove`.'
                );
            }

            guildConfig.setNested(
                guildId,
                'automod',
                moduleName,
                mod
            );

            return message.reply(
                `✅ Rôle gestionnaire ${action === 'add' ? 'ajouté' : 'retiré'}.`
            );
        }

        if (moduleName === 'antiwords') {
            if (sub === 'add') {
                const words = args
                    .slice(2)
                    .join(' ')
                    .split(',')
                    .map(word => word.trim().toLowerCase())
                    .filter(Boolean);

                if (!words.length) {
                    return message.reply(
                        `❌ Utilisation : \`${prefix}automod antiwords add mot1, mot2, phrase\``
                    );
                }

                const added = [];

                for (const word of words) {
                    if (!mod.words.includes(word)) {
                        mod.words.push(word);
                        added.push(word);
                    }
                }

                guildConfig.setNested(
                    guildId,
                    'automod',
                    moduleName,
                    mod
                );

                return message.reply(
                    added.length
                        ? `✅ ${added.length} élément(s) ajouté(s).`
                        : '⚠️ Tous les éléments sont déjà présents.'
                );
            }

            if (sub === 'remove' || sub === 'rm') {
                const word = args
                    .slice(2)
                    .join(' ')
                    .trim()
                    .toLowerCase();

                if (!word) {
                    return message.reply(
                        `❌ Utilisation : \`${prefix}automod antiwords remove mot\``
                    );
                }

                const oldLength = mod.words.length;

                mod.words = mod.words.filter(
                    item => item !== word
                );

                if (mod.words.length === oldLength) {
                    return message.reply(
                        `❌ \`${word}\` n'est pas dans la liste.`
                    );
                }

                guildConfig.setNested(
                    guildId,
                    'automod',
                    moduleName,
                    mod
                );

                return message.reply(
                    `✅ \`${word}\` supprimé.`
                );
            }

            if (sub === 'list') {
                if (!mod.words.length) {
                    return message.reply(
                        '📋 La liste des mots interdits est vide.'
                    );
                }

                return message.reply(
                    `🚫 **Mots interdits (${mod.words.length})**\n` +
                    mod.words.map(word => `• \`${word}\``).join('\n')
                );
            }

            if (sub === 'clear') {
                const count = mod.words.length;

                mod.words = [];

                guildConfig.setNested(
                    guildId,
                    'automod',
                    moduleName,
                    mod
                );

                return message.reply(
                    `✅ ${count} élément(s) supprimé(s).`
                );
            }
        }

        if (moduleName === 'antispam') {
            if (sub === 'limit') {
                const value = Number(args[2]);

                if (!Number.isInteger(value) || value < 2 || value > 50) {
                    return message.reply(
                        '❌ La limite doit être comprise entre 2 et 50.'
                    );
                }

                mod.maxMessages = value;

                guildConfig.setNested(
                    guildId,
                    'automod',
                    moduleName,
                    mod
                );

                return message.reply(
                    `✅ Limite définie à **${value} messages**.`
                );
            }

            if (sub === 'interval') {
                const value = Number(args[2]);

                if (!Number.isInteger(value) || value < 1000 || value > 60000) {
                    return message.reply(
                        '❌ L\'intervalle doit être compris entre 1000 et 60000 ms.'
                    );
                }

                mod.interval = value;

                guildConfig.setNested(
                    guildId,
                    'automod',
                    moduleName,
                    mod
                );

                return message.reply(
                    `✅ Intervalle défini à **${value} ms**.`
                );
            }

            if (sub === 'duplicates') {
                const value = Number(args[2]);

                if (!Number.isInteger(value) || value < 2 || value > 20) {
                    return message.reply(
                        '❌ La limite doit être comprise entre 2 et 20.'
                    );
                }

                mod.duplicateLimit = value;

                guildConfig.setNested(
                    guildId,
                    'automod',
                    moduleName,
                    mod
                );

                return message.reply(
                    `✅ Limite de doublons définie à **${value}**.`
                );
            }
        }

        if (moduleName === 'anticaps') {
            if (sub === 'minimum') {
                const value = Number(args[2]);

                if (!Number.isInteger(value) || value < 3 || value > 200) {
                    return message.reply(
                        '❌ La longueur doit être comprise entre 3 et 200.'
                    );
                }

                mod.minimumLength = value;

                guildConfig.setNested(
                    guildId,
                    'automod',
                    moduleName,
                    mod
                );

                return message.reply(
                    `✅ Longueur minimale définie à **${value} caractères**.`
                );
            }

            if (sub === 'percentage') {
                const value = Number(args[2]);

                if (!Number.isInteger(value) || value < 50 || value > 100) {
                    return message.reply(
                        '❌ Le seuil doit être compris entre 50 et 100%.'
                    );
                }

                mod.percentage = value;

                guildConfig.setNested(
                    guildId,
                    'automod',
                    moduleName,
                    mod
                );

                return message.reply(
                    `✅ Seuil défini à **${value}%**.`
                );
            }
        }

        if (moduleName === 'antimention') {
            if (sub === 'users') {
                const value = Number(args[2]);

                if (!Number.isInteger(value) || value < 1 || value > 20) {
                    return message.reply(
                        '❌ La limite doit être comprise entre 1 et 20.'
                    );
                }

                mod.maxUsers = value;

                guildConfig.setNested(
                    guildId,
                    'automod',
                    moduleName,
                    mod
                );

                return message.reply(
                    `✅ Limite membres définie à **${value}**.`
                );
            }

            if (sub === 'roles') {
                const value = Number(args[2]);

                if (!Number.isInteger(value) || value < 1 || value > 20) {
                    return message.reply(
                        '❌ La limite doit être comprise entre 1 et 20.'
                    );
                }

                mod.maxRoles = value;

                guildConfig.setNested(
                    guildId,
                    'automod',
                    moduleName,
                    mod
                );

                return message.reply(
                    `✅ Limite rôles définie à **${value}**.`
                );
            }

            if (sub === 'total') {
                const value = Number(args[2]);

                if (!Number.isInteger(value) || value < 1 || value > 30) {
                    return message.reply(
                        '❌ La limite doit être comprise entre 1 et 30.'
                    );
                }

                mod.maxTotal = value;

                guildConfig.setNested(
                    guildId,
                    'automod',
                    moduleName,
                    mod
                );

                return message.reply(
                    `✅ Limite totale définie à **${value}**.`
                );
            }
        }

        return message.reply(
            `❌ Sous-commande inconnue.\nUtilisez \`${prefix}aide-automod\` pour voir toutes les possibilités.`
        );
    }
};