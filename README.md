# 🤖 MultiBot

<p align="center">
  <a href="#english"><b>English</b></a> |
  <a href="#francais"><b>Français</b></a>
</p>

---

<a id="english"></a>

# English

## Description

MultiBot is a multifunctional Discord bot built with Node.js and Discord.js v14.

It provides moderation, economy, music, tickets, utilities and other features for managing and improving Discord servers.

## Features

### Moderation

- Ban, kick, mute and warn system
- Moderation commands
- Configurable permissions
- Moderation logs
- Anti-raid protection
- Anti-spam protection
- Captcha system

### Economy

- User balance
- Bank system
- Daily rewards
- Payments between users
- Leaderboards
- Casino and virtual gambling games
- Economy commands

### Music

- Music playback
- YouTube and SoundCloud support
- Queue management
- Skip and stop controls
- Playlist management
- Voice channel integration

### Tickets

- Fully configurable ticket system
- Multiple ticket categories
- Custom category descriptions
- Custom category emojis
- Dedicated staff roles for each category
- Different Discord categories for each ticket type
- Ticket logs
- Customizable ticket panel color
- Customizable panel description
- Discord Components V2 interface
- Button when only one category is configured
- Select menu when multiple categories are configured

Example:

    +ticket addcat Support 🎫 Need help with the server
    +ticket setrole Support @Support
    +ticket setcategory Support 123456789012345678
    +ticket setlog #ticket-logs
    +ticket panel #support

### Utilities

- Bot information
- Server information
- User information
- Ping and latency
- Help system
- Server management utilities

## Requirements

- Node.js 18 or newer
- npm
- A Discord application
- A Discord bot token
- Required Discord permissions and intents

## Installation

Clone the repository:

    git clone https://github.com/ylsvh/MultiBot.git
    cd MultiBot

Install the dependencies:

    npm install

Then configure `config.js`.

## Configuration

Example `config.js`:

    module.exports = {
        token: "YOUR_DISCORD_TOKEN",
        clientId: "YOUR_CLIENT_ID",
        prefix: "+",
        embedColor: "#49ff02",
        ownerId: "YOUR_DISCORD_ID",
        supportServerInvite: "https://discord.gg/your-server"
    };

### Configuration options

| Option | Description |
|---|---|
| `token` | Discord bot token |
| `clientId` | Discord application / bot client ID |
| `prefix` | Prefix used for prefix commands |
| `embedColor` | Default embed color |
| `ownerId` | Discord ID of the bot owner |
| `supportServerInvite` | Support server invitation |

Never share your Discord bot token publicly.

## Starting the Bot

    node index.js

The bot should connect to Discord and become available on your server.

## Ticket System

Available ticket commands:

    +ticket panel [#channel]
    +ticket addcat <name> [emoji] [description]
    +ticket removecat <name>
    +ticket setrole <category> @Role
    +ticket removerole <category> @Role
    +ticket setcategory <category> <ID>
    +ticket setdesc [category] <text>
    +ticket setcolor <#hex>
    +ticket setlog #channel
    +ticket config

Each ticket category can have:

- A unique name
- An emoji
- A description
- One or more staff roles
- A dedicated Discord category

When only one category exists, the ticket panel automatically uses a button.

When multiple categories exist, the ticket panel automatically uses a select menu.

## Project Structure

    ├── index.js
    ├── config.js
    ├── version.js
    ├── data/
    └── src/
        ├── assets/
        ├── commands/
        ├── slashCommands/
        ├── events/
        ├── structure/
        └── utils/

### Main directories

- `commands/` — Prefix commands
- `slashCommands/` — Slash commands
- `events/` — Discord event handlers
- `structure/` — Main bot handlers and structures
- `utils/` — Utility modules
- `assets/` — Images, fonts and other resources
- `data/` — Persistent data and configuration

## Commands

The default prefix is:

    +

Examples:

    +help
    +ping
    +ticket
    +ticket config

The available commands may change depending on the version of MultiBot.

## Deployment

MultiBot can be deployed on any VPS or cloud platform supporting Node.js.

Examples:

- Railway
- Render
- Replit
- OVHcloud
- Hetzner
- DigitalOcean

For 24/7 operation, a VPS or cloud hosting service is recommended.

## Environment Variables

If environment variables are used:

    DISCORD_TOKEN=your_discord_token
    CLIENT_ID=your_client_id
    OWNER_ID=your_discord_id

Never commit your `.env` file or Discord bot token to GitHub.

## Discord Permissions

Depending on enabled features, MultiBot may require:

- Manage Channels
- Manage Roles
- Kick Members
- Ban Members
- Moderate Members
- View Channels
- Send Messages
- Manage Messages
- Connect
- Speak
- Embed Links
- Read Message History

Required permissions depend on the commands and modules being used.

## Contributing

1. Fork the repository
2. Create a branch:

    git checkout -b feature/MyFeature

3. Make your changes
4. Commit:

    git commit -m "Add MyFeature"

5. Push:

    git push origin feature/MyFeature

6. Open a Pull Request

## License

This project is licensed under the MIT License.

See [`LICENSE`](LICENSE) for more information.

---

<a id="francais"></a>

# Français

## Description

MultiBot est un bot Discord multifonctions développé avec Node.js et Discord.js v14.

Il propose des fonctionnalités de modération, d'économie, de musique, de tickets, d'utilitaires et différents outils permettant de gérer et d'améliorer les serveurs Discord.

## Fonctionnalités

### Modération

- Système de ban, kick, mute et warn
- Commandes de modération
- Permissions configurables
- Logs de modération
- Protection anti-raid
- Protection anti-spam
- Système de captcha

### Économie

- Balance utilisateur
- Système bancaire
- Récompenses quotidiennes
- Paiements entre utilisateurs
- Classements
- Casino et jeux virtuels
- Commandes liées à l'économie

### Musique

- Lecture de musique
- Support YouTube et SoundCloud
- Gestion de la file d'attente
- Commandes skip et stop
- Gestion des playlists
- Intégration avec les salons vocaux

### Tickets

- Système de tickets entièrement configurable
- Plusieurs catégories de tickets
- Descriptions personnalisées
- Emojis personnalisés
- Rôles staff dédiés à chaque catégorie
- Catégorie Discord différente pour chaque type de ticket
- Logs des tickets
- Couleur personnalisable du panneau
- Description personnalisable du panneau
- Interface Discord Components V2
- Bouton lorsqu'une seule catégorie est configurée
- Menu de sélection lorsque plusieurs catégories existent

Exemple :

    +ticket addcat Support 🎫 Besoin d'aide sur le serveur
    +ticket setrole Support @Support
    +ticket setcategory Support 123456789012345678
    +ticket setlog #ticket-logs
    +ticket panel #support

### Utilitaires

- Informations sur le bot
- Informations sur le serveur
- Informations sur les utilisateurs
- Ping et latence
- Système d'aide
- Outils de gestion du serveur

## Prérequis

- Node.js 18 ou plus récent
- npm
- Une application Discord
- Un token de bot Discord
- Les permissions et intents Discord nécessaires

## Installation

Cloner le repository :

    git clone https://github.com/ylsvh/MultiBot.git
    cd MultiBot

Installer les dépendances :

    npm install

Puis configurer `config.js`.

## Configuration

Exemple de `config.js` :

    module.exports = {
        token: "VOTRE_TOKEN_DISCORD",
        clientId: "VOTRE_CLIENT_ID",
        prefix: "+",
        embedColor: "#49ff02",
        ownerId: "VOTRE_ID_DISCORD",
        supportServerInvite: "https://discord.gg/votre-serveur"
    };

### Options de configuration

| Option | Description |
|---|---|
| `token` | Token du bot Discord |
| `clientId` | Client ID de l'application / du bot Discord |
| `prefix` | Préfixe utilisé pour les commandes préfixées |
| `embedColor` | Couleur par défaut des embeds |
| `ownerId` | ID Discord du propriétaire du bot |
| `supportServerInvite` | Invitation du serveur Discord de support |

Ne partagez jamais votre token Discord publiquement.

## Lancement

    node index.js

Le bot devrait se connecter à Discord et devenir disponible sur votre serveur.

## Système de Tickets

Commandes disponibles :

    +ticket panel [#salon]
    +ticket addcat <nom> [emoji] [description]
    +ticket removecat <nom>
    +ticket setrole <catégorie> @Role
    +ticket removerole <catégorie> @Role
    +ticket setcategory <catégorie> <ID>
    +ticket setdesc [catégorie] <texte>
    +ticket setcolor <#hex>
    +ticket setlog #salon
    +ticket config

Chaque catégorie de ticket peut avoir :

- Un nom unique
- Un emoji
- Une description
- Un ou plusieurs rôles staff
- Une catégorie Discord dédiée

Lorsqu'une seule catégorie existe, le panneau de tickets utilise automatiquement un bouton.

Lorsque plusieurs catégories existent, le panneau utilise automatiquement un menu de sélection.

## Structure du projet

    ├── index.js
    ├── config.js
    ├── version.js
    ├── data/
    └── src/
        ├── assets/
        ├── commands/
        ├── slashCommands/
        ├── events/
        ├── structure/
        └── utils/

### Dossiers principaux

- `commands/` — Commandes préfixées
- `slashCommands/` — Commandes slash
- `events/` — Gestionnaires d'événements Discord
- `structure/` — Handlers et structures principales du bot
- `utils/` — Modules utilitaires
- `assets/` — Images, polices et autres ressources
- `data/` — Données persistantes et configurations

## Commandes

Le préfixe par défaut est :

    +

Exemples :

    +help
    +ping
    +ticket
    +ticket config

Les commandes disponibles peuvent évoluer selon la version de MultiBot.

## Déploiement

MultiBot peut être déployé sur n'importe quel VPS ou plateforme cloud compatible avec Node.js.

Exemples :

- Railway
- Render
- Replit
- OVHcloud
- Hetzner
- DigitalOcean

Pour faire fonctionner le bot 24/7, un VPS ou un hébergement cloud est recommandé.

## Variables d'environnement

Si votre installation utilise des variables d'environnement :

    DISCORD_TOKEN=votre_token_discord
    CLIENT_ID=votre_client_id
    OWNER_ID=votre_id_discord

Ne mettez jamais votre fichier `.env` ou votre token Discord sur GitHub.

## Permissions Discord

Selon les fonctionnalités activées, MultiBot peut avoir besoin de permissions telles que :

- Gérer les salons
- Gérer les rôles
- Expulser des membres
- Bannir des membres
- Modérer les membres
- Voir les salons
- Envoyer des messages
- Gérer les messages
- Se connecter aux salons vocaux
- Parler dans les salons vocaux
- Intégrer des liens
- Lire l'historique des messages

Les permissions nécessaires dépendent des commandes et modules utilisés.

## Contribution

1. Forker le repository
2. Créer une branche :

    git checkout -b feature/MaFonctionnalite

3. Effectuer les modifications
4. Créer un commit :

    git commit -m "Ajout de MaFonctionnalite"

5. Envoyer la branche :

    git push origin feature/MaFonctionnalite

6. Ouvrir une Pull Request

## Licence

Ce projet est distribué sous licence MIT.

Voir [`LICENSE`](LICENSE) pour plus d'informations.
