const guildConfig = require('../utils/guildConfig');
const points = require('../utils/points');

const voiceSessions = new Map();

function getSessionKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

function isValidVoiceChannel(state) {
  return Boolean(
    state.channelId &&
    state.member &&
    !state.member.user.bot
  );
}

function startSession(oldState, newState) {
  if (!isValidVoiceChannel(newState)) return;

  const guildId = newState.guild.id;
  const userId = newState.member.id;
  const key = getSessionKey(guildId, userId);

  if (voiceSessions.has(key)) return;
  voiceSessions.set(key, {
    guildId,
    userId,
    channelId: newState.channelId,
    startedAt: Date.now()
  });
}

function endSession(oldState, newState) {
  if (!oldState.member || oldState.member.user.bot) return;

  const guildId = oldState.guild.id;
  const userId = oldState.member.id;
  const key = getSessionKey(guildId, userId);

  const session = voiceSessions.get(key);

  if (!session) return;
  voiceSessions.delete(key);

  const elapsedMs =
    Date.now() - session.startedAt;

  const elapsedMinutes =
    Math.floor(elapsedMs / 60000);

  if (elapsedMinutes <= 0) return;
  const pointsConfig = guildConfig.get(
    guildId,
    'pointsConfig'
  );

  const pointsPerMinute =
    Number(pointsConfig?.voicePoints) || 0;
  if (pointsPerMinute <= 0) return;
  const amount =
    elapsedMinutes * pointsPerMinute;
  points.addPoints(
    guildId,
    userId,
    amount
  );
}

module.exports = {
  name: 'voiceStateUpdate',
  once: false,
  execute(oldState, newState) {
    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;

    if (!oldChannelId && newChannelId) {
      startSession(oldState, newState);
      return;
    }

    if (oldChannelId && !newChannelId) {
      endSession(oldState, newState);
      return;
    }

    if (
      oldChannelId &&
      newChannelId &&
      oldChannelId !== newChannelId
    ) {
      const guildId = newState.guild.id;
      const userId = newState.member.id;
      const key = getSessionKey(guildId, userId);

      const session = voiceSessions.get(key);

      if (session) {
        session.channelId = newChannelId;
      }
    }
  }
};
