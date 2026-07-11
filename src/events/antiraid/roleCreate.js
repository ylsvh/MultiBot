const { Events } = require("discord.js");
const { checkRaid } = require("../../utils/antiraid");

module.exports = {
    name: Events.GuildRoleCreate,

    async execute(role) {

        const logs = await role.guild.fetchAuditLogs({
            limit: 1,
            type: 30
        });

        const entry = logs.entries.first();

        if (!entry) return;

        checkRaid(
            role.client,
            role.guild,
            entry.executor,
            "roleCreate",
            "Création excessive de rôles"
        );
    }
};