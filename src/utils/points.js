const guildConfig = require('./guildConfig');

function getPointsData(guildId) {
  const points = guildConfig.get(guildId, 'points') || {};

  return points;
}

function getUserPoints(guildId, userId) {
  const points = getPointsData(guildId);

  if (!points[userId]) {
    points[userId] = {
      current: 0,
      total: 0
    };
  }

  return points[userId];
}

function savePoints(guildId, points) {
  guildConfig.set(guildId, 'points', points);
}

function addPoints(guildId, userId, amount) {
  amount = Number(amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return getUserPoints(guildId, userId);
  }

  const points = getPointsData(guildId);

  if (!points[userId]) {
    points[userId] = {
      current: 0,
      total: 0
    };
  }

  points[userId].current += amount;
  points[userId].total += amount;

  savePoints(guildId, points);

  return points[userId];
}

function removePoints(guildId, userId, amount) {
  amount = Number(amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return getUserPoints(guildId, userId);
  }

  const points = getPointsData(guildId);

  if (!points[userId]) {
    points[userId] = {
      current: 0,
      total: 0
    };
  }

  points[userId].current = Math.max(
    0,
    points[userId].current - amount
  );

  savePoints(guildId, points);

  return points[userId];
}

function resetCurrentPoints(guildId) {
  const points = getPointsData(guildId);

  for (const userId of Object.keys(points)) {
    points[userId].current = 0;
  }

  savePoints(guildId, points);
}

function getLeaderboard(guildId) {
  const points = getPointsData(guildId);

  return Object.entries(points)
    .map(([userId, data]) => ({
      userId,
      current: Number(data.current) || 0,
      total: Number(data.total) || 0
    }))
    .sort((a, b) => b.current - a.current);
}

function getPosition(guildId, userId) {
  const leaderboard = getLeaderboard(guildId);

  const index = leaderboard.findIndex(
    entry => entry.userId === userId
  );

  if (index === -1) {
    return null;
  }

  return index + 1;
}

module.exports = {
  getPointsData,
  getUserPoints,
  addPoints,
  removePoints,
  resetCurrentPoints,
  getLeaderboard,
  getPosition
};
