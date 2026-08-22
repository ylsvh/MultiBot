const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    name: 'covid',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        try {
            const response = await fetch('https://disease.sh/v3/covid-19/all');

            if (!response.ok) {
                throw new Error(`API COVID-19 inaccessible : ${response.status}`);
            }

            const data = await response.json();

            const formatNumber = (number) => {
                return Number(number || 0).toLocaleString('fr-FR');
            };

            const updated = new Date(data.updated).toLocaleString('fr-FR');

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '# 🦠 Statistiques COVID-19\n' +
                        'Données mondiales actuelles'
                    )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## 📊 Cas\n\n' +
                        `**Cas aujourd’hui :** ${formatNumber(data.todayCases)}\n` +
                        `**Cas totaux :** ${formatNumber(data.cases)}\n` +
                        `**Cas actifs :** ${formatNumber(data.active)}\n` +
                        `**Cas critiques :** ${formatNumber(data.critical)}\n` +
                        `**Cas / million :** ${formatNumber(data.casesPerOneMillion)}`
                    )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## ☠️ Décès\n\n' +
                        `**Décès aujourd’hui :** ${formatNumber(data.todayDeaths)}\n` +
                        `**Décès totaux :** ${formatNumber(data.deaths)}\n` +
                        `**Décès / million :** ${formatNumber(data.deathsPerOneMillion)}`
                    )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## 💚 Rétablissements\n\n' +
                        `**Rétablis aujourd’hui :** ${formatNumber(data.todayRecovered)}\n` +
                        `**Rétablis au total :** ${formatNumber(data.recovered)}\n` +
                        `**Rétablis / million :** ${formatNumber(data.recoveredPerOneMillion)}`
                    )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## 🧪 Tests\n\n' +
                        `**Tests réalisés :** ${formatNumber(data.tests)}\n` +
                        `**Tests / million :** ${formatNumber(data.testsPerOneMillion)}\n\n` +
                        `*Dernière mise à jour : ${updated}*`
                    )
                );

            await message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error('[COVID] Erreur :', error);

            const errorContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '# ❌ Erreur\n\n' +
                        'Impossible de récupérer les statistiques du COVID-19 actuellement.'
                    )
                );

            await message.reply({
                components: [errorContainer],
                flags: MessageFlags.IsComponentsV2
            });
        }
    }
};