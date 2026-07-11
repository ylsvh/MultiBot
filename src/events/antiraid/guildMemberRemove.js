const { Events } = require("discord.js");
const { checkRaid } = require("../../utils/antiraid");

module.exports = {
    name: Events.GuildMemberRemove,

    async execute(member) {

        const logs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: 20
        });

        const entry = logs.entries.first();

        if (!entry) return;

        if (!entry.executor) return;

        checkRaid(
            member.client,
            member.guild,
            entry.executor,
            "kick",
            "Expulsions excessives"
        );
    }
};