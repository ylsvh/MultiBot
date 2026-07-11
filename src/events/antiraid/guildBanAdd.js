const { Events } = require("discord.js");
const { checkRaid } = require("../../utils/antiraid");

module.exports = {
    name: Events.GuildBanAdd,

    async execute(ban) {

        const logs = await ban.guild.fetchAuditLogs({
            limit: 1,
            type: 22
        });

        const entry = logs.entries.first();

        if (!entry) return;

        checkRaid(
            ban.client,
            ban.guild,
            entry.executor,
            "ban",
            "Bannissements excessifs"
        );
    }
};