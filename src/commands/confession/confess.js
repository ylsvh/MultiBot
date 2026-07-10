const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require("discord.js");

const guildConfig = require("../../utils/guildConfig");

module.exports = {
    name: "confess",
    description: "Envoyer une confession anonymement",

    async execute(client, message, args) {

        const enabled = guildConfig.get(message.guild.id, "confessionEnabled");

        if (!enabled)
            return message.reply("❌ Le système de confession n'est pas activé.");

        const channelId = guildConfig.get(message.guild.id, "confessionChannel");

        if (!channelId)
            return message.reply("❌ Aucun salon de confession n'est configuré.");

        const blocked = guildConfig.get(message.guild.id, "blockedUsers") || [];

        if (blocked.includes(message.author.id))
            return message.reply("🚫 Vous êtes interdit d'utiliser les confessions.");

        const confession = args.join(" ").trim();

        if (!confession)
            return message.reply("❌ Utilisation : `+confess <message>`");

        const channel = message.guild.channels.cache.get(channelId);

        if (!channel)
            return message.reply("❌ Le salon configuré est introuvable.");

        let confessions = guildConfig.get(message.guild.id, "confessions") || [];

        const id = confessions.length + 1;

        const container = new ContainerBuilder()
            .setAccentColor(0x9B59B6);

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# 🤫 Confession #${id}`
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(confession)
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "-# Cette confession est totalement anonyme."
            )
        );

        const sent = await channel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [container]
        });

        confessions.push({
            id,
            author: message.author.id,
            content: confession,
            messageId: sent.id,
            timestamp: Date.now()
        });

        guildConfig.set(
            message.guild.id,
            "confessions",
            confessions
        );

        await message.reply(`✅ Votre confession **#${id}** a été envoyée anonymement.`);

        if (message.deletable) {
            setTimeout(() => message.delete().catch(() => {}), 1500);
        }

    }
};