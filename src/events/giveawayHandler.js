const {
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
} = require('discord.js');
const guildConfig = require('../utils/guildConfig');
const gw = require('../utils/giveawayManager');

function parseRoleInput(str, guild) {
    if (!str) return null;
    const mention = str.match(/^<@&(\d+)>$/);
    if (mention) return mention[1];
    if (/^\d+$/.test(str) && guild.roles.cache.has(str)) return str;
    return null;
}

function parseChannelInput(str, guild) {
    if (!str) return null;
    const mention = str.match(/^<#(\d+)>$/);
    if (mention) return mention[1];
    if (/^\d+$/.test(str) && guild.channels.cache.has(str)) return str;
    return null;
}

function isValidHex(str) { return /^#[0-9a-fA-F]{6}$/.test(str); }
function isValidUrl(str) { try { new URL(str); return true; } catch { return false; } }

async function refreshWizard(guild, draft) {
    try {
        const ch = guild.channels.cache.get(draft.wizardChannelId);
        if (!ch) return;
        const msg = await ch.messages.fetch(draft.wizardMessageId).catch(() => null);
        if (!msg) return;
        await msg.edit({
            components: [gw.buildWizardEmbed(draft), ...gw.buildWizardRows(draft)],
            flags: MessageFlags.IsComponentsV2
        });
    } catch {}
}

async function openWizardModal(interaction, draft) {
    const { customId } = interaction;
    const modal = new ModalBuilder();
    const input = (id, label, style, value, placeholder, required = false) =>
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(style)
                .setValue(value || '').setPlaceholder(placeholder || '').setRequired(required)
        );

    if (customId === 'gw_set_prize') {
        modal.setCustomId('gw_modal_prize').setTitle('🏆 Prix du Giveaway');
        modal.addComponents(input('v', 'Prix', TextInputStyle.Short, draft.prize, 'Ex: iPhone 15 Pro, 50€ Nitro...', true));
    } else if (customId === 'gw_set_duration') {
        modal.setCustomId('gw_modal_duration').setTitle('⏱️ Durée du Giveaway');
        modal.addComponents(input('v', 'Durée', TextInputStyle.Short, draft.durationStr, 'Ex: 1h, 30m, 2d, 1j12h', true));
    } else if (customId === 'gw_set_winners') {
        modal.setCustomId('gw_modal_winners').setTitle('👥 Nombre de gagnants');
        modal.addComponents(input('v', 'Gagnants', TextInputStyle.Short, String(draft.winners), 'Ex: 1, 3, 5', true));
    } else if (customId === 'gw_set_description') {
        modal.setCustomId('gw_modal_description').setTitle('📝 Description');
        modal.addComponents(input('v', 'Description', TextInputStyle.Paragraph, draft.description, 'Description optionnelle du giveaway...'));
    } else if (customId === 'gw_set_color') {
        modal.setCustomId('gw_modal_color').setTitle('🎨 Couleur de l\'embed');
        modal.addComponents(input('v', 'Couleur hex', TextInputStyle.Short, draft.color, '#F1C40F', true));
    } else if (customId === 'gw_set_image') {
        modal.setCustomId('gw_modal_image').setTitle('🖼️ Image du Giveaway');
        modal.addComponents(
            input('img', 'Image principale (URL)', TextInputStyle.Short, draft.image, 'https://...'),
            input('thumb', 'Miniature (URL)', TextInputStyle.Short, draft.thumbnail, 'https://...')
        );
    } else if (customId === 'gw_set_notif') {
        modal.setCustomId('gw_modal_notif').setTitle('🔔 Notification');
        modal.addComponents(input('v', 'Qui notifier ?', TextInputStyle.Short, draft.notifStr, 'everyone, here, @RoleName, ou ID rôle'));
    } else if (customId === 'gw_set_condition') {
        modal.setCustomId('gw_modal_condition').setTitle('🔒 Rôle requis');
        modal.addComponents(input('v', 'ID ou mention du rôle requis', TextInputStyle.Short, draft.requiredRoleId ? `<@&${draft.requiredRoleId}>` : '', '@Membre, ID...'));
    } else if (customId === 'gw_set_channel') {
        modal.setCustomId('gw_modal_channel').setTitle('📡 Salon du Giveaway');
        modal.addComponents(input('v', 'ID ou #mention du salon', TextInputStyle.Short, draft.channelId ? `<#${draft.channelId}>` : '', '#giveaways ou ID...'));
    }

    await interaction.showModal(modal);
}

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.guild) return;

        const { customId } = interaction;

        if (interaction.isButton() && customId === 'gw_enter') {
            const giveaway = gw.get(interaction.message.id);
            if (!giveaway) return interaction.reply({ content: '❌ Ce giveaway est introuvable.', ephemeral: true });
            if (giveaway.ended) return interaction.reply({ content: '❌ Ce giveaway est terminé.', ephemeral: true });
            if (giveaway.endTime <= Date.now()) return interaction.reply({ content: '❌ Ce giveaway est expiré.', ephemeral: true });

            const uid = interaction.user.id;
            let entries = [...giveaway.entries];
            let msg;

            if (entries.includes(uid)) {
                entries = entries.filter(id => id !== uid);
                msg = '✅ Tu as **retiré** ta participation de ce giveaway.';
            } else {
                if (giveaway.requiredRoleId) {
                    const member = interaction.member;
                    if (!member.roles.cache.has(giveaway.requiredRoleId)) {
                        return interaction.reply({ content: `❌ Vous devez avoir le rôle <@&${giveaway.requiredRoleId}> pour participer.`, ephemeral: true });
                    }
                }
                entries.push(uid);
                msg = `🎉 Tu es **inscrit** au giveaway ! Tu concours pour **${giveaway.prize}**.`;
            }

            gw.update(giveaway.messageId, { entries });
            const updated = gw.get(giveaway.messageId);
            const container = gw.buildGiveawayEmbed(updated);
            const row = gw.buildEntryRow(updated);

            await interaction.update({ components: [container, row], flags: MessageFlags.IsComponentsV2 });
            await interaction.followUp({ content: msg, ephemeral: true });
            return;
        }

        if (interaction.isButton() && customId.startsWith('gw_set_')) {
            const draft = gw.getDraft(interaction.guild.id, interaction.user.id);
            if (!draft) return interaction.reply({ content: '❌ Aucun wizard de giveaway actif pour vous.', ephemeral: true });
            if (draft.wizardMessageId !== interaction.message.id) {
                return interaction.reply({ content: '❌ Ce wizard ne vous appartient pas.', ephemeral: true });
            }
            return openWizardModal(interaction, draft);
        }

        if (interaction.isButton() && customId === 'gw_launch') {
            const draft = gw.getDraft(interaction.guild.id, interaction.user.id);
            if (!draft || draft.wizardMessageId !== interaction.message.id) {
                return interaction.reply({ content: '❌ Aucun wizard actif.', ephemeral: true });
            }
            if (!draft.prize || !draft.durationStr) {
                return interaction.reply({ content: '❌ Le **prix** et la **durée** sont obligatoires.', ephemeral: true });
            }

            const targetChannel = draft.channelId
                ? interaction.guild.channels.cache.get(draft.channelId) || interaction.channel
                : interaction.channel;

            const endTime = Date.now() + draft.duration;
            const giveaway = {
                guildId: interaction.guild.id,
                channelId: targetChannel.id,
                messageId: null,
                prize: draft.prize,
                description: draft.description,
                hostId: draft.hostId,
                winners: draft.winners,
                entries: [],
                requiredRoleId: draft.requiredRoleId,
                notifRole: draft.notifRole,
                endTime,
                ended: false,
                winnerIds: [],
                color: draft.color || '#F1C40F',
                image: draft.image,
                thumbnail: draft.thumbnail,
                createdAt: Date.now()
            };

            const gwContainer = gw.buildGiveawayEmbed(giveaway);
            const row = gw.buildEntryRow(giveaway);

            if (draft.notifRole) {
                let notifContent = null;
                if (draft.notifRole === 'everyone') notifContent = '@everyone — 🎉 Nouveau Giveaway !';
                else if (draft.notifRole === 'here') notifContent = '@here — 🎉 Nouveau Giveaway !';
                else notifContent = `<@&${draft.notifRole}> — 🎉 Nouveau Giveaway !`;
                await targetChannel.send({ content: notifContent, allowedMentions: { parse: ['everyone', 'roles'] } });
            }

            const gwMsg = await targetChannel.send({
                components: [gwContainer, row],
                flags: MessageFlags.IsComponentsV2
            });

            giveaway.messageId = gwMsg.id;
            gw.create(giveaway);
            gw.deleteDraft(interaction.guild.id, interaction.user.id);

            const successContainer = new ContainerBuilder().setAccentColor(0x57F287);
            successContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## ✅ Giveaway lancé !')
            );
            successContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true));
            successContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `Votre giveaway pour **${draft.prize}** est maintenant actif dans ${targetChannel} !\n🆔 \`${gwMsg.id}\``
                )
            );
            successContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# <t:${Math.floor(Date.now() / 1000)}:F>`)
            );

            await interaction.update({ components: [successContainer], flags: MessageFlags.IsComponentsV2 });
            return;
        }

        if (interaction.isButton() && customId === 'gw_cancel') {
            const draft = gw.getDraft(interaction.guild.id, interaction.user.id);
            if (!draft || draft.wizardMessageId !== interaction.message.id) {
                return interaction.reply({ content: '❌ Ce wizard ne vous appartient pas.', ephemeral: true });
            }
            gw.deleteDraft(interaction.guild.id, interaction.user.id);
            await interaction.update({ content: '✖ Création de giveaway annulée.', components: [] });
            return;
        }

        if (interaction.isModalSubmit()) {
            const draft = gw.getDraft(interaction.guild.id, interaction.user.id);

            if (customId.startsWith('gw_modal_cfg_')) {
                const gcfg = guildConfig.getAll(interaction.guild.id);
                await interaction.deferReply({ ephemeral: true });

                if (customId === 'gw_modal_cfg_color') {
                    const v = interaction.fields.getTextInputValue('value').trim();
                    if (!isValidHex(v)) return interaction.editReply('❌ Couleur invalide. Format : `#RRGGBB`');
                    guildConfig.setNested(interaction.guild.id, 'giveawayConfig', 'defaultColor', v);
                    return interaction.editReply(`✅ Couleur par défaut définie sur \`${v}\`.`);
                }
                if (customId === 'gw_modal_cfg_channel') {
                    const v = interaction.fields.getTextInputValue('value').trim();
                    if (!v) {
                        guildConfig.setNested(interaction.guild.id, 'giveawayConfig', 'defaultChannelId', null);
                        return interaction.editReply('✅ Salon par défaut supprimé.');
                    }
                    const chId = parseChannelInput(v, interaction.guild);
                    if (!chId) return interaction.editReply('❌ Salon introuvable. Mentionnez-le ou donnez son ID.');
                    guildConfig.setNested(interaction.guild.id, 'giveawayConfig', 'defaultChannelId', chId);
                    return interaction.editReply(`✅ Salon par défaut défini sur <#${chId}>.`);
                }
                if (customId === 'gw_modal_cfg_winners') {
                    const v = parseInt(interaction.fields.getTextInputValue('value').trim());
                    if (isNaN(v) || v < 1) return interaction.editReply('❌ Nombre invalide.');
                    guildConfig.setNested(interaction.guild.id, 'giveawayConfig', 'defaultWinners', v);
                    return interaction.editReply(`✅ Nombre de gagnants par défaut : **${v}**.`);
                }
                if (customId === 'gw_modal_cfg_roles') {
                    const v = interaction.fields.getTextInputValue('value').trim();
                    if (!v) {
                        guildConfig.setNested(interaction.guild.id, 'giveawayConfig', 'managerRoles', []);
                        return interaction.editReply('✅ Rôles gestionnaires réinitialisés.');
                    }
                    const ids = v.split(/[\s,]+/).filter(s => s).map(s => {
                        const m = s.match(/^<@&(\d+)>$/);
                        return m ? m[1] : (/^\d+$/.test(s) ? s : null);
                    }).filter(Boolean);
                    guildConfig.setNested(interaction.guild.id, 'giveawayConfig', 'managerRoles', ids);
                    return interaction.editReply(`✅ ${ids.length} rôle(s) gestionnaire(s) défini(s).`);
                }
                return;
            }

            if (!draft) return;

            await interaction.deferReply({ ephemeral: true });

            if (customId === 'gw_modal_prize') {
                draft.prize = interaction.fields.getTextInputValue('v').trim();
            } else if (customId === 'gw_modal_duration') {
                const raw = interaction.fields.getTextInputValue('v').trim();
                const ms = gw.parseDuration(raw);
                if (!ms) return interaction.editReply('❌ Durée invalide. Exemples : `1h`, `30m`, `2d`, `1j12h`');
                if (ms < 10000) return interaction.editReply('❌ Durée minimale : 10 secondes.');
                if (ms > 30 * 24 * 3600000) return interaction.editReply('❌ Durée maximale : 30 jours.');
                draft.duration = ms;
                draft.durationStr = gw.formatDuration(ms);
            } else if (customId === 'gw_modal_winners') {
                const v = parseInt(interaction.fields.getTextInputValue('v'));
                if (isNaN(v) || v < 1 || v > 50) return interaction.editReply('❌ Entre 1 et 50 gagnants.');
                draft.winners = v;
            } else if (customId === 'gw_modal_description') {
                draft.description = interaction.fields.getTextInputValue('v').trim() || null;
            } else if (customId === 'gw_modal_color') {
                const v = interaction.fields.getTextInputValue('v').trim();
                if (!isValidHex(v)) return interaction.editReply('❌ Couleur invalide. Format : `#RRGGBB`');
                draft.color = v;
            } else if (customId === 'gw_modal_image') {
                const img = interaction.fields.getTextInputValue('img').trim();
                const thumb = interaction.fields.getTextInputValue('thumb').trim();
                if (img && !isValidUrl(img)) return interaction.editReply('❌ URL image invalide.');
                if (thumb && !isValidUrl(thumb)) return interaction.editReply('❌ URL miniature invalide.');
                draft.image = img || null;
                draft.thumbnail = thumb || null;
            } else if (customId === 'gw_modal_notif') {
                const v = interaction.fields.getTextInputValue('v').trim().toLowerCase();
                if (!v) { draft.notifRole = null; draft.notifStr = null; }
                else if (v === 'everyone' || v === '@everyone') { draft.notifRole = 'everyone'; draft.notifStr = '@everyone'; }
                else if (v === 'here' || v === '@here') { draft.notifRole = 'here'; draft.notifStr = '@here'; }
                else {
                    const roleId = parseRoleInput(v, interaction.guild);
                    if (!roleId) return interaction.editReply('❌ Rôle introuvable. Utilisez `everyone`, `here`, ou une mention/ID de rôle.');
                    draft.notifRole = roleId;
                    draft.notifStr = `<@&${roleId}>`;
                }
            } else if (customId === 'gw_modal_condition') {
                const v = interaction.fields.getTextInputValue('v').trim();
                if (!v) { draft.requiredRoleId = null; }
                else {
                    const roleId = parseRoleInput(v, interaction.guild);
                    if (!roleId) return interaction.editReply('❌ Rôle introuvable. Utilisez une mention ou un ID de rôle.');
                    draft.requiredRoleId = roleId;
                }
            } else if (customId === 'gw_modal_channel') {
                const v = interaction.fields.getTextInputValue('v').trim();
                if (!v) { draft.channelId = null; }
                else {
                    const chId = parseChannelInput(v, interaction.guild);
                    if (!chId) return interaction.editReply('❌ Salon introuvable.');
                    draft.channelId = chId;
                }
            }

            gw.setDraft(interaction.guild.id, interaction.user.id, draft);
            await refreshWizard(interaction.guild, draft);
            await interaction.editReply({ content: '✅ Valeur mise à jour !' });
            return;
        }

        if (interaction.isButton() && customId === 'gw_panel_create') {
            const gcfg = guildConfig.getAll(interaction.guild.id);
            const existing = gw.getDraft(interaction.guild.id, interaction.user.id);
            if (existing) return interaction.reply({ content: '❌ Vous avez déjà un wizard actif. Terminez-le d\'abord.', ephemeral: true });

            const draft = gw.createDraft(interaction.guild.id, interaction.user.id, gcfg.giveawayConfig);
            const wizardMsg = await interaction.channel.send({
                components: [gw.buildWizardEmbed(draft), ...gw.buildWizardRows(draft)],
                flags: MessageFlags.IsComponentsV2
            });
            draft.wizardMessageId = wizardMsg.id;
            draft.wizardChannelId = interaction.channel.id;
            gw.setDraft(interaction.guild.id, interaction.user.id, draft);
            await interaction.reply({ content: '✅ Wizard ouvert ci-dessous.', ephemeral: true });
            return;
        }

        if (interaction.isButton() && customId === 'gw_panel_list') {
            await interaction.deferReply({ ephemeral: true });
            const actives = gw.getActiveByGuild(interaction.guild.id);
            if (actives.length === 0) return interaction.editReply('❌ Aucun giveaway actif.');
            return interaction.editReply({
                content: actives.map((g, i) =>
                    `**${i + 1}. ${g.prize}** · 🎟️ ${g.entries.length} · ⏱️ <t:${Math.floor(g.endTime / 1000)}:R>\n🆔 \`${g.messageId}\``
                ).join('\n')
            });
        }

        if (interaction.isButton() && customId === 'gw_panel_config') {
            await interaction.reply({ content: `⚙️ Utilisez \`${guildConfig.get(interaction.guild.id, 'prefix') || '+'}gw-config\` pour configurer les giveaways.`, ephemeral: true });
            return;
        }

        if (interaction.isStringSelectMenu() && customId === 'gw_panel_select') {
            const msgId = interaction.values[0];
            const giveaway = gw.get(msgId);
            if (!giveaway) return interaction.reply({ content: '❌ Giveaway introuvable.', ephemeral: true });

            let hexColor = 0xF1C40F;
            if (giveaway.color) {
                const parsed = parseInt(giveaway.color.replace('#', ''), 16);
                if (!isNaN(parsed)) hexColor = parsed;
            }

            const manageContainer = new ContainerBuilder().setAccentColor(hexColor);
            manageContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## 🎉 Gérer : ${giveaway.prize}`)
            );
            manageContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true));
            manageContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**🏆 Gagnants :** ${giveaway.winners}\n` +
                    `**🎟️ Participants :** ${giveaway.entries.length}\n` +
                    `**⏱️ Se termine :** <t:${Math.floor(giveaway.endTime / 1000)}:R>\n` +
                    `**📡 Salon :** <#${giveaway.channelId}>\n` +
                    `**👤 Organisé par :** <@${giveaway.hostId}>\n` +
                    `**🆔 Message ID :** \`${giveaway.messageId}\``
                )
            );
            manageContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('-# Choisissez une action ci-dessous.')
            );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`gw_manage_end_${msgId}`).setLabel('🔚 Terminer').setStyle(ButtonStyle.Danger).setDisabled(giveaway.ended),
                new ButtonBuilder().setCustomId(`gw_manage_reroll_${msgId}`).setLabel('🔄 Reroll').setStyle(ButtonStyle.Primary).setDisabled(!giveaway.ended),
                new ButtonBuilder().setCustomId(`gw_manage_delete_${msgId}`).setLabel('🗑️ Supprimer').setStyle(ButtonStyle.Danger)
            );

            await interaction.reply({ components: [manageContainer, row], flags: MessageFlags.IsComponentsV2, ephemeral: true });
            return;
        }

        if (interaction.isButton() && customId.startsWith('gw_manage_')) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                const gcfg = guildConfig.getAll(interaction.guild.id);
                const mgr = gcfg.giveawayConfig?.managerRoles || [];
                if (!mgr.some(r => interaction.member.roles.cache.has(r))) {
                    return interaction.reply({ content: '❌ Permission insuffisante.', ephemeral: true });
                }
            }

            const parts = customId.split('_');
            const action = parts[2];
            const msgId = parts.slice(3).join('_');
            const giveaway = gw.get(msgId);
            if (!giveaway) return interaction.reply({ content: '❌ Giveaway introuvable.', ephemeral: true });

            if (action === 'end') {
                if (giveaway.ended) return interaction.reply({ content: '❌ Déjà terminé.', ephemeral: true });
                await interaction.deferReply({ ephemeral: true });
                await gw.endGiveaway(giveaway, client);
                return interaction.editReply(`✅ Giveaway **${giveaway.prize}** terminé !`);
            }

            if (action === 'reroll') {
                if (!giveaway.ended) return interaction.reply({ content: '❌ Ce giveaway est encore actif.', ephemeral: true });
                if (giveaway.entries.length === 0) return interaction.reply({ content: '❌ Aucun participant.', ephemeral: true });
                await interaction.deferReply({ ephemeral: true });

                let eligible = [...giveaway.entries];
                if (giveaway.requiredRoleId) {
                    await interaction.guild.members.fetch().catch(() => {});
                    eligible = eligible.filter(uid => {
                        const m = interaction.guild.members.cache.get(uid);
                        return m && m.roles.cache.has(giveaway.requiredRoleId);
                    });
                }
                if (eligible.length === 0) return interaction.editReply('❌ Aucun participant éligible.');
                const newWinners = eligible.sort(() => Math.random() - 0.5).slice(0, giveaway.winners);
                gw.update(giveaway.messageId, { winnerIds: newWinners });

                const channel = interaction.guild.channels.cache.get(giveaway.channelId);
                if (channel) {
                    await channel.send({
                        content: `🔄 **Reroll** — Nouveau(x) gagnant(s) pour **${giveaway.prize}** : ${newWinners.map(id => `<@${id}>`).join(', ')} 🎉`,
                        allowedMentions: { users: newWinners }
                    }).catch(() => {});
                }
                return interaction.editReply(`✅ Reroll effectué ! Gagnant(s) : ${newWinners.map(id => `<@${id}>`).join(', ')}`);
            }

            if (action === 'delete') {
                const channel = interaction.guild.channels.cache.get(giveaway.channelId);
                if (channel) {
                    const msg = await channel.messages.fetch(giveaway.messageId).catch(() => null);
                    if (msg) await msg.delete().catch(() => {});
                }
                gw.remove(msgId);
                return interaction.reply({ content: `✅ Giveaway **${giveaway.prize}** supprimé.`, ephemeral: true });
            }
        }
    }
};
