const { MessageFlags } = require('discord.js');
const guildConfig = require('../../utils/guildConfig');
const {
    getModule, setModule, setModuleField,
    isManager, buildConfigContainer, ACTIONS
} = require('../../utils/automodConfig');

const MODULE = 'antiwords';

module.exports = {
    name: 'antiwords',
    description: 'Configure la liste noire de mots/phrases',
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
            return message.reply('✅ Anti-mots **activé**.');
        }
        if (sub === 'off') {
            setModuleField(message.guild.id, MODULE, 'enabled', false);
            return message.reply('✅ Anti-mots **désactivé**.');
        }

        if (sub === 'action') {
            const action = args[1]?.toLowerCase();
            if (!ACTIONS.includes(action)) {
                return message.reply(`❌ Action invalide. Valeurs possibles : \`${ACTIONS.join(', ')}\``);
            }
            setModuleField(message.guild.id, MODULE, 'action', action);
            return message.reply(`✅ Action définie sur \`${action}\`.`);
        }

        if (sub === 'add') {
            const input = args.slice(1).join(' ').toLowerCase();

            if (!input) {
                return message.reply(`❌ Précisez au moins un mot : \`${prefix}antiwords add mot1, mot2, mot3\``);
            }

            const current = getModule(message.guild.id, MODULE);

            // 🔥 split par virgule + clean
            const words = input
                .split(',')
                .map(w => w.trim())
                .filter(w => w.length > 0);

            if (!words.length) {
                return message.reply('❌ Aucun mot valide fourni.');
            }

            let added = [];
            let skipped = [];

            for (const word of words) {
                if (current.words.some(w => w.toLowerCase() === word)) {
                    skipped.push(word);
                } else {
                    current.words.push(word);
                    added.push(word);
                }
            }

            setModule(message.guild.id, MODULE, current);

            return message.reply(
                `✅ ${added.length} mot(s) ajouté(s).\n` +
                (added.length ? `➕ ${added.map(w => `\`${w}\``).join(', ')}\n` : '') +
                (skipped.length ? `⚠️ Déjà présents : ${skipped.map(w => `\`${w}\``).join(', ')}` : '')
            );
        }

        if (sub === 'remove' || sub === 'rm') {
            const word = args.slice(1).join(' ').trim().toLowerCase();
            if (!word) return message.reply(`❌ Précisez le mot à retirer : \`${prefix}antiwords remove <mot>\``);
            const current = getModule(message.guild.id, MODULE);
            const before = current.words.length;
            current.words = current.words.filter(w => w.toLowerCase() !== word);
            if (current.words.length === before) {
                return message.reply(`❌ \`${word}\` n'est pas dans la liste noire.`);
            }
            setModule(message.guild.id, MODULE, current);
            return message.reply(`✅ Mot \`${word}\` retiré de la liste noire.`);
        }

        if (sub === 'list') {
            const current = getModule(message.guild.id, MODULE);
            if (!current.words.length) {
                return message.reply('📋 La liste noire est vide.');
            }
            const chunks = [];
            let chunk = '';
            for (const w of current.words) {
                const entry = `\`${w}\`  `;
                if (chunk.length + entry.length > 1800) {
                    chunks.push(chunk);
                    chunk = entry;
                } else {
                    chunk += entry;
                }
            }
            if (chunk) chunks.push(chunk);
            await message.reply(`**🚫 Mots bannis (${current.words.length}) :**\n${chunks[0]}`);
            for (let i = 1; i < chunks.length; i++) {
                await message.channel.send(chunks[i]);
            }
            return;
        }

        if (sub === 'clear') {
            const current = getModule(message.guild.id, MODULE);
            const count = current.words.length;
            current.words = [];
            setModule(message.guild.id, MODULE, current);
            return message.reply(`✅ Liste noire vidée (${count} mot(s) supprimé(s)).`);
        }

        if (sub === 'log') {
            if (args[1]?.toLowerCase() === 'off') {
                setModuleField(message.guild.id, MODULE, 'logChannelId', null);
                return message.reply('✅ Salon de log retiré.');
            }
            const ch = message.mentions.channels.first();
            if (!ch) return message.reply(`❌ Mentionnez un salon : \`${prefix}antiwords log #salon\``);
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
                `\`${prefix}antiwords whitelist role add/rm @role\`\n` +
                `\`${prefix}antiwords whitelist channel add/rm #salon\`\n` +
                `\`${prefix}antiwords whitelist user add/rm @membre\`\n` +
                `\`${prefix}antiwords whitelist clear\``
            );
        }

        if (sub === 'manager') {
            const action = args[1]?.toLowerCase();
            const role = message.mentions.roles.first();
            if (!role) return message.reply(`❌ Mentionnez un rôle : \`${prefix}antiwords manager add/rm @role\``);
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
            return message.reply(`❌ Usage : \`${prefix}antiwords manager add/rm @role\``);
        }

        return message.reply(
            `**🚫 Anti-Mots — Aide**\n` +
            `\`${prefix}antiwords\` — Afficher la configuration\n` +
            `\`${prefix}antiwords on/off\` — Activer/désactiver\n` +
            `\`${prefix}antiwords action <delete|warn|mute|kick|ban>\` — Définir l'action\n` +
            `\`${prefix}antiwords add <mot ou phrase>\` — Ajouter un mot banni\n` +
            `\`${prefix}antiwords remove <mot>\` — Retirer un mot\n` +
            `\`${prefix}antiwords list\` — Lister tous les mots bannis\n` +
            `\`${prefix}antiwords clear\` — Vider la liste noire\n` +
            `\`${prefix}antiwords log #salon\` / \`log off\` — Salon de log\n` +
            `\`${prefix}antiwords whitelist role add/rm @role\` — Rôles exemptés\n` +
            `\`${prefix}antiwords whitelist channel add/rm #salon\` — Salons exemptés\n` +
            `\`${prefix}antiwords whitelist user add/rm @membre\` — Membres exemptés\n` +
            `\`${prefix}antiwords whitelist clear\` — Supprimer toutes les exemptions\n` +
            `\`${prefix}antiwords manager add/rm @role\` — Rôles gestionnaires`
        );
    }
};
