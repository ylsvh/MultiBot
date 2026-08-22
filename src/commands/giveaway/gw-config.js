const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionsBitField,
} = require('discord.js');
const guildConfig = require('../../utils/guildConfig');

function buildContainer(gc, footer = null) {
    const defaultCh  = gc.defaultChannelId ? `<#${gc.defaultChannelId}>` : '*Non défini (salon actuel)*';
    const defaultWin = gc.defaultWinners || 1;

    const managerRoles = gc.managerRoles?.length > 0
        ? gc.managerRoles.map(r => `<@&${r}>`).join(', ')
        : '*Aucun (admins seulement)*';

    const container = new ContainerBuilder()
        .setAccentColor(0x2B2D31);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## ⚙️ Configuration des Giveaways')
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(1).setDivider(true)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `📡 **Salon par défaut :** ${defaultCh}\n` +
            `👥 **Gagnants par défaut :** ${defaultWin}\n` +
            `🔑 **Rôles gestionnaires :** ${managerRoles}`
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(1).setDivider(true)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            footer
                ? `-# ${footer}`
                : '-# Cliquez sur un bouton pour modifier une valeur.'
        )
    );

    return container;
}

function buildRows(disabled = false) {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('gw_cfg_channel')
            .setLabel('📡 Salon')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),

        new ButtonBuilder().setCustomId('gw_cfg_winners')
            .setLabel('👥 Gagnants')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),

        new ButtonBuilder().setCustomId('gw_cfg_roles')
            .setLabel('🔑 Rôles')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('gw_cfg_reset')
            .setLabel('🔄 Reset')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled),

        new ButtonBuilder().setCustomId('gw_cfg_close')
            .setLabel('✖ Fermer')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled)
    );

    return [row1, row2];
}

module.exports = {
    name: 'gw-config',
    description: 'Configuration giveaways (V2)',

    async execute(client, message) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return message.reply('❌ Permission requise : Gérer le serveur.');
        }

        const cfg = guildConfig.getAll(message.guild.id);
        const gc  = cfg.giveawayConfig || {};

        const [row1, row2] = buildRows();
        const container = buildContainer(gc);

        container.addActionRowComponents(row1, row2);

        const msg = await message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 120000,
        });

        collector.on('collect', async interaction => {

            if (interaction.customId === 'gw_cfg_close') {
                const closed = buildContainer(gc, '✖ Fermé.');
                await interaction.update({
                    components: [closed],
                    flags: MessageFlags.IsComponentsV2,
                });
                return collector.stop();
            }

            if (interaction.customId === 'gw_cfg_reset') {
                guildConfig.setNested(message.guild.id, 'giveawayConfig', 'defaultChannelId', null);
                guildConfig.setNested(message.guild.id, 'giveawayConfig', 'defaultWinners', 1);
                guildConfig.setNested(message.guild.id, 'giveawayConfig', 'managerRoles', []);

                await interaction.reply({
                    content: '✅ Configuration reset.',
                    ephemeral: true
                });

                return refresh(msg, message.guild.id);
            }

            const modal = new ModalBuilder();

            const gcNow = guildConfig.getAll(message.guild.id).giveawayConfig || {};

            if (interaction.customId === 'gw_cfg_channel') {
                modal.setCustomId('gw_modal_channel').setTitle('📡 Salon');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('value')
                            .setLabel('ID ou #salon')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                    )
                );
            }

            else if (interaction.customId === 'gw_cfg_winners') {
                modal.setCustomId('gw_modal_winners').setTitle('👥 Gagnants');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('value')
                            .setLabel('Nombre')
                            .setStyle(TextInputStyle.Short)
                            .setValue(String(gcNow.defaultWinners || 1))
                    )
                );
            }

            else if (interaction.customId === 'gw_cfg_roles') {
                modal.setCustomId('gw_modal_roles').setTitle('🔑 Rôles');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('value')
                            .setLabel('IDs séparés par virgule')
                            .setStyle(TextInputStyle.Paragraph)
                    )
                );
            }

            await interaction.showModal(modal);
        });

        collector.on('end', () => refresh(msg, message.guild.id, true));
    }
};

async function refresh(msg, guildId, closed = false) {
    const gc = guildConfig.getAll(guildId).giveawayConfig || {};

    const container = buildContainer(
        gc,
        closed ? '✖ Expiré.' : '✅ Mis à jour.'
    );

    if (!closed) {
        const [row1, row2] = buildRows();
        container.addActionRowComponents(row1, row2);
    }

    await msg.edit({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
    }).catch(() => {});
}
