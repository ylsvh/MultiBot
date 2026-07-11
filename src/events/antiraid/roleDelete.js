const { Events } = require("discord.js");
const { checkRaid } = require("../../utils/antiraid");

module.exports = {
    name: Events.GuildRoleDelete,

    async execute(role) {

        const logs = await role.guild.fetchAuditLogs({
            limit: 1,
            type: 32
        });

        const entry = logs.entries.first();

        if (!entry) return;

        checkRaid(
            role.client,
            role.guild,
            entry.executor,
            "roleDelete",
            "Suppression excessive de rôles"
        );
    }
};