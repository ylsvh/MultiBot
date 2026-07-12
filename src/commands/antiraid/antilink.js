const { MessageFlags } = require('discord.js');
const guildConfig = require('../../utils/guildConfig');
const {
    getModule, setModule, setModuleField,
    isManager, buildConfigContainer, ACTIONS
} = require('../../utils/automodConfig');

const MODULE = 'antilink';

module.exports = {
    name: 'antilink',
    description: 'Configure le filtre anti-liens (toutes URLs)',
    async execute(client, message, args) {
        const mod = getModule(message.guild.id, MODULE);
        if (!isManager(message.member, mod)) {
            return message.reply('❌ Permission insuffisante. (**Gérer le serveur** ou rôle gestionnaire requis)');
        }

        const prefix = guildConfig.get(message.guild.id, 'prefix') || '+';
        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'config') {
            const container = buildConfigContainer(MODULE, mod, message.guild);
            return message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }

        if (sub === 'on') {
            setModuleField(message.guild.id, MODULE, 'enabled', true);
            return message.reply('✅ Anti-liens **activé**.');
        }
        if (sub === 'off') {
            setModuleField(message.guild.id, MODULE, 'enabled', false);
            return message.reply('✅ Anti-liens **désactivé**.');
        }

        if (sub === 'action') {
            const action = args[1]?.toLowerCase();
            if (!ACTIONS.includes(action)) {
                return message.reply(`❌ Action invalide. Valeurs possibles : \`${ACTIONS.join(', ')}\``);
            }
            setModuleField(message.guild.id, MODULE, 'action', action);
            return message.reply(`✅ Action définie sur \`${action}\`.`);
        }

        if (sub === 'log') {
            if (args[1]?.toLowerCase() === 'off') {
                setModuleField(message.guild.id, MODULE, 'logChannelId', null);
                return message.reply('✅ Salon de log retiré.');
            }
            const ch = message.mentions.channels.first();
            if (!ch) return message.reply(`❌ Mentionnez un salon : \`${prefix}antilink log #salon\``);
            setModuleField(message.guild.id, MODULE, 'logChannelId', ch.id);
            return message.reply(`✅ Salon de log défini : ${ch}`);
        }

        if (sub === 'whitelist') {
            const type = args[1]?.toLowerCase();
            const action = args[2]?.toLowerCase();
            const current = getModule(message.guild.id, MODULE);

            if (type === 'clear') {
                current.whitelistRoles = [];
                current.whitelistChannels = [];
                current.whitelistUsers = [];
                setModule(message.guild.id, MODULE, current);
                return message.reply('✅ Toutes les exemptions supprimées.');
            }

            if (type === 'role') {
                const role = message.mentions.roles.first();
                if (!role) return message.reply('❌ Mentionnez un rôle.');
                if (action === 'add') {
                    if (!current.whitelistRoles.includes(role.id)) current.whitelistRoles.push(role.id);
                    setModule(message.guild.id, MODULE, current);
                    return message.reply(`✅ Rôle **${role.name}** ajouté aux exemptions.`);
                }
                if (action === 'remove' || action === 'rm') {
                    current.whitelistRoles = current.whitelistRoles.filter(id => id !== role.id);
                    setModule(message.guild.id, MODULE, current);
                    return message.reply(`✅ Rôle **${role.name}** retiré des exemptions.`);
                }
            }

            if (type === 'channel') {
                const ch = message.mentions.channels.first();
                if (!ch) return message.reply('❌ Mentionnez un salon.');
                if (action === 'add') {
                    if (!current.whitelistChannels.includes(ch.id)) current.whitelistChannels.push(ch.id);
                    setModule(message.guild.id, MODULE, current);
                    return message.reply(`✅ Salon ${ch} ajouté aux exemptions.`);
                }
                if (action === 'remove' || action === 'rm') {
                    current.whitelistChannels = current.whitelistChannels.filter(id => id !== ch.id);
                    setModule(message.guild.id, MODULE, current);
                    return message.reply(`✅ Salon ${ch} retiré des exemptions.`);
                }
            }

            if (type === 'user') {
                const user = message.mentions.users.first();
                if (!user) return message.reply('❌ Mentionnez un utilisateur.');
                if (action === 'add') {
                    if (!current.whitelistUsers.includes(user.id)) current.whitelistUsers.push(user.id);
                    setModule(message.guild.id, MODULE, current);
                    return message.reply(`✅ ${user.tag} ajouté aux exemptions.`);
                }
                if (action === 'remove' || action === 'rm') {
                    current.whitelistUsers = current.whitelistUsers.filter(id => id !== user.id);
                    setModule(message.guild.id, MODULE, current);
                    return message.reply(`✅ ${user.tag} retiré des exemptions.`);
                }
            }

            return message.reply(
                `❌ Usage exemptions :\n` +
                `\`${prefix}antilink whitelist role add/rm @role\`\n` +
                `\`${prefix}antilink whitelist channel add/rm #salon\`\n` +
                `\`${prefix}antilink whitelist user add/rm @membre\`\n` +
                `\`${prefix}antilink whitelist clear\``
            );
        }

        if (sub === 'manager') {
            const action = args[1]?.toLowerCase();
            const role = message.mentions.roles.first();
            if (!role) return message.reply(`❌ Mentionnez un rôle : \`${prefix}antilink manager add/rm @role\``);
            const current = getModule(message.guild.id, MODULE);
            if (action === 'add') {
                if (!current.managerRoles.includes(role.id)) current.managerRoles.push(role.id);
                setModule(message.guild.id, MODULE, current);
                return message.reply(`✅ Rôle **${role.name}** ajouté aux gestionnaires.`);
            }
            if (action === 'remove' || action === 'rm') {
                current.managerRoles = current.managerRoles.filter(id => id !== role.id);
                setModule(message.guild.id, MODULE, current);
                return message.reply(`✅ Rôle **${role.name}** retiré des gestionnaires.`);
            }
            return message.reply(`❌ Usage : \`${prefix}antilink manager add/rm @role\``);
        }

        return message.reply(
            `**🌐 Anti-Liens — Aide**\n` +
            `\`${prefix}antilink\` — Afficher la configuration\n` +
            `\`${prefix}antilink on/off\` — Activer/désactiver\n` +
            `\`${prefix}antilink action <delete|warn|mute|kick|ban>\` — Définir l'action\n` +
            `\`${prefix}antilink log #salon\` / \`log off\` — Salon de log automod\n` +
            `\`${prefix}antilink whitelist role add/rm @role\` — Rôles exemptés\n` +
            `\`${prefix}antilink whitelist channel add/rm #salon\` — Salons exemptés\n` +
            `\`${prefix}antilink whitelist user add/rm @membre\` — Membres exemptés\n` +
            `\`${prefix}antilink whitelist clear\` — Supprimer toutes les exemptions\n` +
            `\`${prefix}antilink manager add/rm @role\` — Rôles gestionnaires`
        );
    }
};
