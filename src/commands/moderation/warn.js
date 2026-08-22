const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    PermissionsBitField
} = require('discord.js');

const warningsDatabase = require('../../utils/warningsDatabase');

module.exports = {
    name: 'warn',
    description: 'Donner un avertissement',

    async execute(client, message, args) {
        await message.channel.sendTyping();

        const subcommand = args[0]?.toLowerCase();

        if (subcommand === 'list' || subcommand === 'liste') {
            return this.warnlist(message, args);
        }

        if (subcommand === 'perm' || subcommand === 'permissions') {
            return this.warnperm(message, args);
        }

        return this.warn(message, args);
    },

    async warn(message, args) {
        const guild = message.guild;
        const moderator = message.member;

        const isOwner = guild.ownerId === moderator.id;

        const isAdministrator =
            moderator.permissions.has(
                PermissionsBitField.Flags.Administrator
            );

        const authorizedRoles =
            warningsDatabase.getPermissions(guild.id);

        const hasAuthorizedRole =
            moderator.roles.cache.some(role =>
                authorizedRoles.includes(role.id)
            );

        if (!isOwner && !isAdministrator && !hasAuthorizedRole) {
            return message.reply(
                "Tu n'as pas la permission d'utiliser cette commande."
            );
        }

        const member = message.mentions.members.first();

        if (!member) {
            return message.reply(
                "Mentionne un membre à avertir."
            );
        }

        if (!isOwner) {
            if (
                member.roles.highest.comparePositionTo(
                    moderator.roles.highest
                ) >= 0
            ) {
                return message.reply(
                    "Tu ne peux pas avertir ce membre car son rôle est supérieur ou égal au tien."
                );
            }
        }

        const reason = args
            .slice(1)
            .join(' ')
            .trim() || null;

        let warning;

        try {
            warning = warningsDatabase.create(
                guild.id,
                member.id,
                moderator.id,
                reason
            );
        } catch (error) {
            console.error(
                "Erreur lors de la création de l'avertissement :",
                error
            );

            return message.reply(
                "Une erreur est survenue lors de la création de l'avertissement."
            );
        }

        const total = warningsDatabase.countUserWarnings(
            guild.id,
            member.id
        );

        let response =
            `⚠️ **Avertissement ajouté à ${member.user.tag}.**`;

        if (reason) {
            response += `\n**Raison :** ${reason}`;
        }

        response += `\n**Nombre total d'avertissements :** ${total}`;

        await message.reply(response);

        try {
            let dm =
                `⚠️ Vous avez reçu un avertissement sur **${guild.name}**.` +
                `\n**Modérateur :** ${moderator.user.tag}`;

            if (reason) {
                dm += `\n**Raison :** ${reason}`;
            }

            await member.send(dm);
        } catch {}
    },

    async warnlist(message, args) {
        const guild = message.guild;
        const moderator = message.member;

        const isOwner = guild.ownerId === moderator.id;

        const isAdministrator =
            moderator.permissions.has(
                PermissionsBitField.Flags.Administrator
            );

        const authorizedRoles =
            warningsDatabase.getPermissions(guild.id);

        const hasAuthorizedRole =
            moderator.roles.cache.some(role =>
                authorizedRoles.includes(role.id)
            );

        if (!isOwner && !isAdministrator && !hasAuthorizedRole) {
            return message.reply(
                "Tu n'as pas la permission d'utiliser cette commande."
            );
        }

        const member = message.mentions.members.first();

        if (!member) {
            return message.reply(
                "Mentionne un membre pour voir ses avertissements."
            );
        }

        const userWarnings =
            warningsDatabase.getUserWarnings(
                guild.id,
                member.id
            );

        if (userWarnings.length === 0) {
            return message.reply(
                "Ce membre n'a aucun avertissement."
            );
        }

        const warningsPerPage = 5;
        const pages = [];

        for (
            let i = 0;
            i < userWarnings.length;
            i += warningsPerPage
        ) {
            pages.push(
                userWarnings.slice(
                    i,
                    i + warningsPerPage
                )
            );
        }

        let page = 0;

        const createContainer = () => {
            const container = new ContainerBuilder();

            let content =
                `## ⚠️ Avertissements de ${member.user.tag}\n` +
                `**Total :** ${userWarnings.length}\n\n`;

            pages[page].forEach((warning, index) => {
                const date = new Date(
                    warning.createdAt
                ).toLocaleString('fr-FR');

                const moderatorMember =
                    guild.members.cache.get(
                        warning.moderatorId
                    );

                const moderatorName =
                    moderatorMember?.user.tag ||
                    'Modérateur inconnu';

                content +=
                    `### Avertissement ${page * warningsPerPage + index + 1}\n` +
                    `**Modérateur :** ${moderatorName}\n` +
                    `**Date :** ${date}\n` +
                    `**Raison :** ${warning.reason || 'Aucune raison'}\n\n`;
            });

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(content)
            );

            if (pages.length > 1) {
                container.addSeparatorComponents(
                    new SeparatorBuilder()
                );
            }

            return container;
        };

        const createButtons = () => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('warnlist_previous')
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),

                new ButtonBuilder()
                    .setCustomId('warnlist_page')
                    .setLabel(`Page ${page + 1}/${pages.length}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),

                new ButtonBuilder()
                    .setCustomId('warnlist_next')
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(
                        page === pages.length - 1
                    )
            );
        };

        const components = [
            createContainer()
        ];

        if (pages.length > 1) {
            components.push(createButtons());
        }

        const reply = await message.reply({
            components,
            flags: MessageFlags.IsComponentsV2
        });

        if (pages.length <= 1) {
            return;
        }

        const collector =
            reply.createMessageComponentCollector({
                time: 120000
            });

        collector.on(
            'collect',
            async interaction => {
                if (
                    interaction.user.id !==
                    message.author.id
                ) {
                    return interaction.reply({
                        content:
                            "Tu ne peux pas utiliser ces boutons.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (
                    interaction.customId ===
                    'warnlist_previous' &&
                    page > 0
                ) {
                    page--;
                }

                if (
                    interaction.customId ===
                    'warnlist_next' &&
                    page < pages.length - 1
                ) {
                    page++;
                }

                await interaction.update({
                    components: [
                        createContainer(),
                        createButtons()
                    ],
                    flags: MessageFlags.IsComponentsV2
                });
            }
        );

        collector.on(
            'end',
            async () => {
                try {
                    await reply.edit({
                        components: [
                            createContainer()
                        ],
                        flags: MessageFlags.IsComponentsV2
                    });
                } catch {}
            }
        );
    },

    async warnperm(message, args) {
        const guild = message.guild;

        if (guild.ownerId !== message.author.id) {
            return message.reply(
                "Seul le propriétaire du serveur peut modifier les permissions des avertissements."
            );
        }

        const role = message.mentions.roles.first();

        if (!role) {
            return message.reply(
                "Mentionne un rôle."
            );
        }

        const permissions =
            warningsDatabase.getPermissions(
                guild.id
            );

        if (permissions.includes(role.id)) {
            warningsDatabase.removePermission(
                guild.id,
                role.id
            );

            return message.reply(
                `Le rôle ${role} ne peut plus utiliser les commandes d'avertissement.`
            );
        }

        warningsDatabase.addPermission(
            guild.id,
            role.id
        );

        return message.reply(
            `Le rôle ${role} peut maintenant utiliser les commandes d'avertissement.`
        );
    }
};