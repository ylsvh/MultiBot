const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../../../data/antiraid.json");

function loadData() {
    if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveData(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

const defaultConfig = {
    logs: null,

    limits: {
        roleCreate: 3,
        roleDelete: 3,
        channelCreate: 3,
        channelDelete: 3,
        ban: 3,
        kick: 3
    },

    sanctions: {
        roleCreate: "ban",
        roleDelete: "ban",
        channelCreate: "ban",
        channelDelete: "ban",
        ban: "ban",
        kick: "kick"
    },

    whitelist: []
};

module.exports = {
    name: "config",
    description: "Configure le système anti-raid",

    async execute(client, message, args) {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Vous devez être administrateur pour utiliser cette commande.");
        }

        const data = loadData();

        if (!data[message.guild.id]) {
            data[message.guild.id] = defaultConfig;
            saveData(data);
        }

        const config = data[message.guild.id];

        if (!config.limits) {
            config.limits = defaultConfig.limits;
        }

        if (!config.sanctions) {
            config.sanctions = defaultConfig.sanctions;
        }

        if (!config.whitelist) {
            config.whitelist = [];
        }

        saveData(data);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `# 🛡️ Configuration Anti-Raid\n\n` +

                        `**Salon des logs :** ${config.logs ? `<#${config.logs}>` : "Non configuré"}\n\n` +

                        `## Limites\n` +
                        `👑 Création rôles : ${config.limits.roleCreate}\n` +
                        `🗑️ Suppression rôles : ${config.limits.roleDelete}\n` +
                        `📁 Création salons : ${config.limits.channelCreate}\n` +
                        `🗑️ Suppression salons : ${config.limits.channelDelete}\n` +
                        `🔨 Bans : ${config.limits.ban}\n` +
                        `👢 Kicks : ${config.limits.kick}\n\n` +

                        `## Sanctions\n` +
                        `👑 Création rôles : ${config.sanctions.roleCreate}\n` +
                        `🗑️ Suppression rôles : ${config.sanctions.roleDelete}\n` +
                        `📁 Création salons : ${config.sanctions.channelCreate}\n` +
                        `🗑️ Suppression salons : ${config.sanctions.channelDelete}\n` +
                        `🔨 Bans : ${config.sanctions.ban}\n` +
                        `👢 Kicks : ${config.sanctions.kick}\n\n` +

                        `Whitelist : **${config.whitelist.length} utilisateur(s)**`
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            );


        const limitMenu = new StringSelectMenuBuilder()
            .setCustomId("antiraid_limit_select")
            .setPlaceholder("Modifier une limite")
            .addOptions([
                {
                    label: "Création de rôles",
                    value: "roleCreate",
                    emoji: "👑"
                },
                {
                    label: "Suppression de rôles",
                    value: "roleDelete",
                    emoji: "🗑️"
                },
                {
                    label: "Création de salons",
                    value: "channelCreate",
                    emoji: "📁"
                },
                {
                    label: "Suppression de salons",
                    value: "channelDelete",
                    emoji: "🗑️"
                },
                {
                    label: "Limite des bans",
                    value: "ban",
                    emoji: "🔨"
                },
                {
                    label: "Limite des kicks",
                    value: "kick",
                    emoji: "👢"
                }
            ]);


        const sanctionMenu = new StringSelectMenuBuilder()
            .setCustomId("antiraid_sanction_select")
            .setPlaceholder("Modifier une sanction")
            .addOptions([
                {
                    label: "Sanction création rôles",
                    value: "roleCreate",
                    emoji: "👑"
                },
                {
                    label: "Sanction suppression rôles",
                    value: "roleDelete",
                    emoji: "🗑️"
                },
                {
                    label: "Sanction création salons",
                    value: "channelCreate",
                    emoji: "📁"
                },
                {
                    label: "Sanction suppression salons",
                    value: "channelDelete",
                    emoji: "🗑️"
                },
                {
                    label: "Sanction bans",
                    value: "ban",
                    emoji: "🔨"
                },
                {
                    label: "Sanction kicks",
                    value: "kick",
                    emoji: "👢"
                }
            ]);


        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("antiraid_refresh")
                    .setLabel("Actualiser")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId("antiraid_reset")
                    .setLabel("Réinitialiser")
                    .setStyle(ButtonStyle.Danger)
            );


        await message.channel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [
                container,
                new ActionRowBuilder().addComponents(limitMenu),
                new ActionRowBuilder().addComponents(sanctionMenu),
                buttons
            ]
        });
    }
};