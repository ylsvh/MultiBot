const {
    PermissionsBitField,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');
const gw = require('../../utils/giveawayManager');

function isManager(member, gcfg) {
    if (member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return true;
    const mgr = gcfg.giveawayConfig?.managerRoles || [];
    return mgr.some(r => member.roles.cache.has(r));
}

function buildWizardContainer(draft) {
    const container = new ContainerBuilder()
        .setAccentColor(0x2B2D31);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            '## 🎉 Giveaway Creator\n' +
            'Configure ton giveaway étape par étape.'
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `🎁 **Prix :** ${draft.prize || '*Non défini*'}\n` +
            `⏱️ **Durée :** ${draft.duration || '*Non définie*'}\n` +
            `👥 **Gagnants :** ${draft.winners || 1}\n` +
            `📡 **Salon :** ${draft.channelId ? `<#${draft.channelId}>` : '*Non défini*'}`
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            '-# Utilise les boutons pour configurer le giveaway.'
        )
    );

    return container;
}

function buildWizardRows(disabled = false) {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('gw_wizard_prize')
                .setLabel('🎁 Prix')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled),

            new ButtonBuilder()
                .setCustomId('gw_wizard_duration')
                .setLabel('⏱️ Durée')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled),

            new ButtonBuilder()
                .setCustomId('gw_wizard_winners')
                .setLabel('👥 Gagnants')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled)
        ),

        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('gw_wizard_channel')
                .setLabel('📡 Salon')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled),

            new ButtonBuilder()
                .setCustomId('gw_wizard_start')
                .setLabel('🚀 Lancer')
                .setStyle(ButtonStyle.Success)
                .setDisabled(disabled),

            new ButtonBuilder()
                .setCustomId('gw_wizard_cancel')
                .setLabel('✖ Annuler')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(disabled)
        )
    ];
}

module.exports = {
    name: 'gw-create',
    description: 'Créer un giveaway (V2 + rapide + wizard)',

    async execute(client, message, args) {
        const gcfg = guildConfig.getAll(message.guild.id);

        if (!isManager(message.member, gcfg)) {
            return message.reply(
                '❌ Permission requise : **Gérer le serveur** ou rôle gestionnaire giveaway.'
            );
        }

        if (args.length >= 3) {
            const durationMs = gw.parseDuration(args[0]);
            const winnersCount = parseInt(args[1]);
            const prize = args.slice(2).join(' ');

            if (!durationMs) {
                return message.reply('❌ Durée invalide (ex: 1h, 30m, 2d)');
            }

            if (isNaN(winnersCount) || winnersCount < 1) {
                return message.reply('❌ Nombre de gagnants invalide.');
            }

            if (!prize) {
                return message.reply('❌ Prix requis.');
            }

            const gwcfg = gcfg.giveawayConfig || {};
            const targetChannel =
                gwcfg.defaultChannelId
                    ? message.guild.channels.cache.get(gwcfg.defaultChannelId) || message.channel
                    : message.channel;

            const giveaway = {
                guildId: message.guild.id,
                channelId: targetChannel.id,
                messageId: null,
                prize,
                hostId: message.author.id,
                winners: winnersCount,
                entries: [],
                endTime: Date.now() + durationMs,
                ended: false,
                winnerIds: [],
                createdAt: Date.now(),
            };

            const embed = gw.buildGiveawayEmbed(giveaway);
            const row = gw.buildEntryRow(giveaway);

            const msg = await targetChannel.send({
                embeds: [embed],
                components: [row],
            });

            giveaway.messageId = msg.id;
            gw.create(giveaway);

            return message.reply(`✅ Giveaway lancé dans ${targetChannel}.`);
        }

        const existing = gw.getDraft(message.guild.id, message.author.id);

        if (existing) {
            return message.reply(
                '❌ Un wizard est déjà en cours. Termine-le ou annule-le.'
            );
        }

        const draft = gw.createDraft(
            message.guild.id,
            message.author.id,
            gcfg.giveawayConfig
        );

        const container = buildWizardContainer(draft);
        const rows = buildWizardRows();

        const wizardMsg = await message.channel.send({
            components: [container, ...rows],
            flags: MessageFlags.IsComponentsV2,
        });

        draft.wizardMessageId = wizardMsg.id;
        draft.wizardChannelId = message.channel.id;

        gw.setDraft(message.guild.id, message.author.id, draft);

        await message.delete().catch(() => {});
    },
};
