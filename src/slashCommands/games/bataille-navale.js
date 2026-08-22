const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bataille-navale')
        .setDescription('Joue à la bataille navale')
        .addUserOption(option =>
            option
                .setName('adversaire')
                .setDescription('Le joueur contre lequel jouer')
                .setRequired(true)
        ),

    async execute(client, interaction) {
        const opponent = interaction.options.getUser('adversaire');

        if (opponent.bot) {
            return interaction.reply('Tu ne peux pas jouer contre un bot.');
        }

        if (opponent.id === interaction.user.id) {
            return interaction.reply('Impossible de jouer contre toi-même.');
        }

        const players = [interaction.user.id, opponent.id];
        let currentPlayer = 0;
        const size = 3;

        const boards = [
            Array(size * size).fill('🌊'),
            Array(size * size).fill('🌊')
        ];

        const ships = [
            Math.floor(Math.random() * 9),
            Math.floor(Math.random() * 9)
        ];

        function createBoard() {
            const rows = [];

            for (let i = 0; i < size; i++) {
                const row = new ActionRowBuilder();

                for (let j = 0; j < size; j++) {
                    const index = i * size + j;

                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`naval_${index}`)
                            .setLabel(' ')
                            .setStyle(ButtonStyle.Secondary)
                    );
                }

                rows.push(row);
            }

            return rows;
        }

        const embed = new EmbedBuilder()
            .setTitle('Bataille Navale')
            .setDescription(`Tour de <@${players[currentPlayer]}>`);

        const gameMessage = await interaction.reply({
            embeds: [embed],
            components: createBoard(),
            fetchReply: true
        });

        const collector = gameMessage.createMessageComponentCollector({
            time: 600000
        });

        collector.on('collect', async buttonInteraction => {
            if (!players.includes(buttonInteraction.user.id)) {
                return buttonInteraction.reply({
                    content: 'Tu ne joues pas.',
                    ephemeral: true
                });
            }

            if (buttonInteraction.user.id !== players[currentPlayer]) {
                return buttonInteraction.reply({
                    content: "Ce n'est pas ton tour.",
                    ephemeral: true
                });
            }

            const index = parseInt(
                buttonInteraction.customId.split('_')[1]
            );

            const enemy = currentPlayer === 0 ? 1 : 0;

            if (boards[enemy][index] !== '🌊') {
                return buttonInteraction.reply({
                    content: 'Case déjà attaquée.',
                    ephemeral: true
                });
            }

            if (ships[enemy] === index) {
                boards[enemy][index] = '💥';

                embed.setDescription(
                    `<@${players[currentPlayer]}> a touché le bateau et gagne la partie !`
                );

                collector.stop();

                return buttonInteraction.update({
                    embeds: [embed],
                    components: []
                });
            }

            boards[enemy][index] = '❌';
            currentPlayer = enemy;

            embed.setDescription(
                `Raté. Tour de <@${players[currentPlayer]}>`
            );

            await buttonInteraction.update({
                embeds: [embed],
                components: createBoard()
            });
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'time') {
                embed.setDescription('⏰ La partie a expiré.');

                await gameMessage.edit({
                    embeds: [embed],
                    components: []
                }).catch(() => {});
            }
        });
    }
};