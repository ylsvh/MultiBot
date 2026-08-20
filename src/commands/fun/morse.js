const {
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
    name: 'morse',
    description: 'Convertit un texte en morse.',

    async execute(client, message, args) {
        await message.channel.sendTyping();

        const text = args.join(' ');

        if (!text) {
            return message.reply('❌ Utilisation : `+morse <texte>`');
        }

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

        return message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};