const { ActivityType } = require('discord.js');
const path = require('path');
const fs = require('fs');
const guildConfig = require('../utils/guildConfig');
const {
  SoundCloudExtractor,
  YouTubeExtractor
} = require('@discord-player/extractor');

const LOG_FILE = path.join(__dirname, '../../role_logs.txt');

const statuses = [
  '+help'
];

let currentStatus = 0;

function logAction(message) {
  const date = new Date().toISOString();
  const line = `[${date}] ${message}\n`;

  console.log(line.trim());
  fs.appendFile(LOG_FILE, line, () => {});
}

function updateStatus(client) {
  const status = statuses[currentStatus];

  client.user.setPresence({
    activities: [
      {
        name: status,
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/ton-url-twitch'
      }
    ],
    status: 'online'
  });

  currentStatus = (currentStatus + 1) % statuses.length;
}

async function checkMember(member, config) {
  const statut = config.soutienStatut;
  const roleId = config.soutienRoleId;

  if (!statut || !roleId) return;

  let hasSt = false;

  if (member.presence) {
    for (const activity of member.presence.activities) {
      const texte =
        `${activity.state || ''} ` +
        `${activity.name || ''} ` +
        `${activity.emoji?.name || ''}`;

      if (texte.includes(statut)) {
        hasSt = true;
        break;
      }
    }
  }

  const hasRole = member.roles.cache.has(roleId);

  if (hasSt && !hasRole) {
    await member.roles.add(roleId);

    logAction(
      `[${member.guild.name}] Rôle soutien ajouté à ${member.user.tag}`
    );
  } else if (!hasSt && hasRole) {
    await member.roles.remove(roleId);

    logAction(
      `[${member.guild.name}] Rôle soutien retiré à ${member.user.tag}`
    );
  }
}

async function fullScan(client) {
  for (const guild of client.guilds.cache.values()) {
    const config = guildConfig.getAll(guild.id);

    if (!config.soutienRoleId || !config.soutienStatut) {
      continue;
    }

    try {
      await guild.members.fetch({
        withPresences: true
      });

      for (const member of guild.members.cache.values()) {
        await checkMember(member, config).catch(() => {});
      }
    } catch (err) {
      logAction(
        `Erreur scan ${guild.name}: ${err.message}`
      );
    }
  }
}

module.exports = {
  name: 'clientReady',
  once: true,

  async execute(client) {
    logAction(
      `Bot prêt (${client.user.tag}) — ${client.guilds.cache.size} serveur(s)`
    );

    try {
      if (!client.player) {
        throw new Error('client.player n\'existe pas.');
      }

      await client.player.extractors.register(
        SoundCloudExtractor
      );

      logAction(
        '[MUSIC] SoundCloudExtractor chargé.'
      );

      await client.player.extractors.register(
        YouTubeExtractor
      );

      logAction(
        '[MUSIC] YouTubeExtractor chargé.'
      );
    } catch (err) {
      logAction(
        `[MUSIC] Erreur extractors : ${err.message}`
      );

      console.error(
        '[MUSIC] Erreur extractors:',
        err
      );
    }

    updateStatus(client);

    setInterval(
      () => updateStatus(client),
      5000
    );

    await fullScan(client);

    setTimeout(
      () => fullScan(client),
      10000
    );

    setInterval(
      () => fullScan(client),
      3 * 60 * 1000
    );

    client.checkMember = checkMember;
  }
};
