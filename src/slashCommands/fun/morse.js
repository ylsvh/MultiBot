const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');

const MORSE = {
    a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.',
    g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..',
    m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.',
    s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
    y: '-.--', z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
    5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('morse')
        .setDescription('Convertit un texte en morse.')
        .addStringOption(option =>
            option
                .setName('texte')
                .setDescription('Le texte à convertir en morse')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const text = interaction.options.getString('texte');

        const result = text
            .toLowerCase()
            .split('')
            .map(char => {
                if (char === ' ') return '/';
                return MORSE[char] || char;
            })
            .join(' ');

        const container = new ContainerBuilder()
            .setAccentColor(0x607d8b);

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 📡 Morse')
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**Texte :** ${text}\n\n**Morse :**\n\`${result}\``
            )
        );

        return interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};