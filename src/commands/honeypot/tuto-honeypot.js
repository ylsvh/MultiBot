const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    name: 'tuto-honeypot',
    description: 'Affiche le tutoriel du système Honeypot.',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '# 🍯 Tutoriel — Honeypot\n\n' +
                    'Le **Honeypot** permet de créer un salon piège. Tout membre ou bot qui envoie **le moindre message** dans ce salon sera automatiquement banni du serveur.'
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '## ⚙️ Configuration\n\n' +
                    'Utilisez la commande suivante :\n' +
                    '`+honeypot #salon`\n\n' +
                    'Exemple :\n' +
                    '`+honeypot #ne-pas-ecrire-ici`\n\n' +
                    'Le bot enverra ensuite le message Honeypot dans le salon sélectionné.'
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '## ⚠️ Fonctionnement\n\n' +
                    '• Un membre envoie un message → **ban automatique**\n' +
                    '• Un bot envoie un message → **ban automatique**\n' +
                    '• Le message est supprimé avant le bannissement lorsque Discord le permet.\n' +
                    '• Le bot doit disposer de la permission **Bannir des membres**.\n\n' +
                    '> Le Honeypot est destiné à rester inutilisé. Son but est de détecter automatiquement les personnes qui ne respectent pas son avertissement.'
                )
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};