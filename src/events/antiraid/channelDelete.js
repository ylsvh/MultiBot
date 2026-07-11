const { Events } = require("discord.js");
const { checkRaid } = require("../../utils/antiraid");

module.exports = {
    name: Events.ChannelDelete,

    async execute(channel) {

        const logs = await channel.guild.fetchAuditLogs({
            limit: 1,
            type: 12
        });

        const entry = logs.entries.first();

        if (!entry) return;

        checkRaid(
            channel.client,
            channel.guild,
            entry.executor,
            "channelDelete",
            "Suppression excessive de salons"
        );
    }
};