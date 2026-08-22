const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'conditions',
    description: 'Affiche les conditions de partenariat du serveur',
    async execute(client, message, args) {
        const embed = new EmbedBuilder()
            .setTitle('🤝 Conditions de partenariat')
            .setDescription(`→ Vous souhaitez faire un partenariat avec notre serveur mais vous ne connaissez pas nos différentes conditions ? Eh bien les voici !

➟ Votre serveur doit obligatoirement compter au moins **50 membres**.

➟ Les partenariats se font uniquement via un ping <@&1533035824533344286>.

➟ Nous faisons aucune mention @everyone ou @here.

➟ Les serveurs contenant du contenu NSFW sont strictement refusés.

➟ Nous nous réservons le droit de refuser un partenariat sans justification.

➟ Le respect entre partenaires est obligatoire. Tout comportement irrespectueux entraînera une annulation du partenariat.

*Votre serveur remplit une de nos conditions ? Alors n'hésitez pas à créer un ticket dans le <#1532876999184613446> pour qu'un <@&1533034151890915398> vienne s'occuper de vous !*

**Informations complémentaires :**
• Nous ne sommes **pas obligés de rejoindre votre serveur** pour effectuer le partenariat.
• Une **capture d'écran** ou une **vidéo** pourra vous être demandée afin de prouver que le partenariat a bien été réalisé.
• Les partenariats avec des serveurs **NSFW**, **toxiques**, **inactifs** ou ne respectant pas les **Conditions d'utilisation de Discord** seront automatiquement refusés.`)
            .setColor('#2f3136');

        message.channel.send({ embeds: [embed] });
    }
};
