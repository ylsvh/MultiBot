const {
    PermissionsBitField,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');
const gw = require('../../utils/giveawayManager');

module.exports = {
    name: 'gw-panel',
    description: 'Panneau giveaways (V2)',

    async execute(client, message) {
        const gcfg = guildConfig.getAll(message.guild.id);

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            const mgr = gcfg.giveawayConfig?.managerRoles || [];
            if (!mgr.some(r => message.member.roles.cache.has(r))) {
                return message.reply('❌ Permission insuffisante.');
            }
        }

        return sendPanel(message.channel, message.guild);
    }
};

async function sendPanel(channel, guild) {
    const actives = gw.getActiveByGuild(guild.id)
        .sort((a, b) => b.endTime - a.endTime);

    const prefix = guildConfig.get(guild.id, 'prefix') || '+';

    const container = new ContainerBuilder()
        .setAccentColor(0x2B2D31);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            '## 🎉 Panneau de gestion — Giveaways'
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true)
    );

    if (actives.length === 0) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                '❌ Aucun giveaway actif actuellement.'
            )
        );
    } else {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### 🟢 ${actives.length} giveaway(s) actif(s)`
            )
        );

        for (const g of actives.slice(0, 5)) {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**${g.prize}**\n` +
                    `🎟️ ${g.entries.length} participants · 🏆 ${g.winners} gagnant(s)\n` +
                    `⏱️ <t:${Math.floor(g.endTime / 1000)}:R>\n` +
                    `📡 <#${g.channelId}>\n` +
                    `🆔 \`${g.messageId}\``
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(1)
            );
        }
    }

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `### 📋 Commandes rapides\n` +
            `\`${prefix}gw-create\` → créer\n` +
            `\`${prefix}gw-list\` → liste\n` +
            `\`${prefix}gw-end\` → terminer\n` +
            `\`${prefix}gw-reroll\` → reroll\n` +
            `\`${prefix}gw-delete\` → supprimer\n` +
            `\`${prefix}gw-config\` → config`
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true)
    );

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gw_panel_create')
            .setLabel('➕ Créer')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('gw_panel_config')
            .setLabel('⚙️ Config')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('gw_panel_refresh')
            .setLabel('🔄 Refresh')
            .setStyle(ButtonStyle.Secondary)
    );

    const components = [container, row1];

    if (actives.length > 0) {
        const select = new StringSelectMenuBuilder()
            .setCustomId('gw_panel_select')
            .setPlaceholder('🎯 Gérer un giveaway...')
            .addOptions(
                actives.slice(0, 25).map(g => ({
                    label: g.prize.slice(0, 100),
                    value: g.messageId,
                    description: `${g.entries.length} participants · fin <t:${Math.floor(g.endTime / 1000)}:R>`.slice(0, 100),
                    emoji: '🎉',
                }))
            );

        components.push(
            new ActionRowBuilder().addComponents(select)
        );
    }

    return channel.send({
        components,
        flags: MessageFlags.IsComponentsV2,
    });
}
