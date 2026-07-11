const { Events } = require("discord.js");
const { checkRaid } = require("../../utils/antiraid");

module.exports = {
    name: Events.ChannelCreate,

    async execute(channel) {

        const logs = await channel.guild.fetchAuditLogs({
            limit: 1,
            type: 10
        });

        const entry = logs.entries.first();

        if (!entry) return;

        checkRaid(
            channel.client,
            channel.guild,
            entry.executor,
            "channelCreate",
            "Création excessive de salons"
        );
    }
};