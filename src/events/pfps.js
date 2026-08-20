const {
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} = require("discord.js");

const guildConfig = require("../utils/guildConfig");

const timers = new Map();

function getRandomUser(guild) {
    const members = [...guild.members.cache.values()].filter(
        member => !member.user.bot
    );

    if (!members.length) return null;

    const member = members[Math.floor(Math.random() * members.length)];

    return member.user;
}

async function sendRandomPfp(client, guild) {
    const config = guildConfig.get(guild.id, "pfpsConfig");

    if (!config?.enabled || !config.channelId) return;

    const channel = guild.channels.cache.get(config.channelId);

    if (!channel || !channel.isTextBased()) return;

    const user = getRandomUser(guild);

    if (!user) return;

    const avatar = user.displayAvatarURL({
        extension: "png",
        size: 1024,
        forceStatic: false,
    });

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "## 🎨 PFP"
            )
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true)
        )
        .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder()
                    .setURL(avatar)
                    .setDescription("PFP")
            )
        )
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("Télécharger l'avatar")
                    .setStyle(ButtonStyle.Link)
                    .setURL(avatar)
            )
        );

    try {
        await channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    } catch (error) {
        console.error(
            `[PFPs] Impossible d'envoyer une PFP dans ${guild.name}:`,
            error
        );
    }
}

function startPfps(client, guild) {
    const config = guildConfig.get(guild.id, "pfpsConfig");

    if (!config?.enabled || !config.channelId) return;

    if (timers.has(guild.id)) {
        clearInterval(timers.get(guild.id));
    }

    const interval = config.interval || 30000;

    const timer = setInterval(() => {
        sendRandomPfp(client, guild);
    }, interval);

    timers.set(guild.id, timer);
}

function stopPfps(guildId) {
    const timer = timers.get(guildId);

    if (!timer) return;

    clearInterval(timer);
    timers.delete(guildId);
}

module.exports = {
    name: "ready",
    once: true,

    execute(client) {
        for (const guild of client.guilds.cache.values()) {
            startPfps(client, guild);
        }

        client.on("guildCreate", guild => {
            startPfps(client, guild);
        });

        client.on("pfpsStart", guild => {
            startPfps(client, guild);
        });

        client.on("pfpsStop", guildId => {
            stopPfps(guildId);
        });
    },

    startPfps,
    stopPfps,
    sendRandomPfp,
};
