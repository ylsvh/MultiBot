const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("github")
        .setDescription("Affiche un profil GitHub (Components V2)")
        .addStringOption(option =>
            option
                .setName("username")
                .setDescription("Nom d'utilisateur GitHub")
                .setRequired(true)
        ),

    async execute(interaction) {
        const username = interaction.options.getString("username");

        try {
            const res = await fetch(`https://api.github.com/users/${username}`);

            if (!res.ok) {
                return interaction.reply({
                    content: "❌ Utilisateur GitHub introuvable.",
                    ephemeral: true,
                });
            }

            const data = await res.json();

            let orgsList = "Aucune";

            try {
                const orgsRes = await fetch(data.organizations_url);

                if (orgsRes.ok) {
                    const orgs = await orgsRes.json();

                    if (orgs.length > 0) {
                        orgsList = orgs.map(o => o.login).join(", ");
                    }
                }
            } catch {
                orgsList = "Aucune";
            }

            const container = new ContainerBuilder()
                .setAccentColor(0x2B3137);

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 🧑‍💻 GitHub — ${data.login}`
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `👤 **Utilisateur :** ${data.login}\n` +
                    `🏢 **Entreprise :** ${data.company || "Aucune"}\n` +
                    `📍 **Localisation :** ${data.location || "Aucune"}\n` +
                    `📧 **Email :** ${data.email || "Aucune"}\n` +
                    `📦 **Organisations :** ${orgsList}`
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(1)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `### 📝 Bio\n${data.bio || "Aucune"}`
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `### 📊 Stats\n` +
                    `📦 Repos : **${data.public_repos}**\n` +
                    `👥 Followers : **${data.followers}**\n` +
                    `➕ Following : **${data.following}**`
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(1)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `### 📅 Dates\n` +
                    `🆕 Créé : <t:${Math.floor(new Date(data.created_at).getTime() / 1000)}:F>\n` +
                    `🔄 MAJ : <t:${Math.floor(new Date(data.updated_at).getTime() / 1000)}:F>`
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `-# 🔗 ${data.html_url}`
                )
            );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("🔗 GitHub")
                    .setStyle(ButtonStyle.Link)
                    .setURL(data.html_url),

                new ButtonBuilder()
                    .setCustomId("github_refresh")
                    .setLabel("🔄 Refresh")
                    .setStyle(ButtonStyle.Secondary)
            );

            return interaction.reply({
                components: [container, row],
                flags: MessageFlags.IsComponentsV2,
            });

        } catch (err) {
            console.error(err);

            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({
                    content: "❌ Erreur lors de la récupération du profil GitHub.",
                    ephemeral: true,
                });
            }

            return interaction.reply({
                content: "❌ Erreur lors de la récupération du profil GitHub.",
                ephemeral: true,
            });
        }
    }
};