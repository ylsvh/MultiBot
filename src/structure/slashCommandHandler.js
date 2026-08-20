const fs = require("fs");
const path = require("path");

module.exports = (client) => {
    const slashPath = path.join(__dirname, "../slashCommands");

    const slashFiles = fs
        .readdirSync(slashPath)
        .filter((file) => file.endsWith(".js"));

    for (const file of slashFiles) {
        const command = require(path.join(slashPath, file));

        if (command.data && command.data.name) {
            client.slashCommands.set(command.data.name, command);
            console.log(`Slash command loaded: ${command.data.name}`);
        } else {
            console.log(`❌ Slash command invalid in file ${file}`);
        }
    }

    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = client.slashCommands.get(interaction.commandName);

        if (!command) {
            console.log(
                `❌ Commande slash inconnue : ${interaction.commandName}`
            );
            return;
        }

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(
                `❌ Erreur avec /${interaction.commandName}:`,
                error
            );

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "❌ Une erreur est survenue.",
                    ephemeral: true,
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: "❌ Une erreur est survenue.",
                    ephemeral: true,
                }).catch(() => {});
            }
        }
    });
};
