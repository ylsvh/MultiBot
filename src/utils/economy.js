const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../data/economy.json');
const configPath = path.join(__dirname, '../../data/economyConfig.json');

function loadData() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8') || '{}');
  } catch (error) {
    console.error('Impossible de lire economy.json :', error);
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Impossible de sauvegarder economy.json :', error);
  }
}

function loadConfig() {
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      rewards: {
        daily: {
          min: 100,
          max: 2000
        },
        weekly: {
          min: 1000,
          max: 10000
        },
        monthly: {
          min: 5000,
          max: 50000
        }
      },
      roles: {}
    };

    fs.writeFileSync(
      configPath,
      JSON.stringify(defaultConfig, null, 2)
    );
  }

  try {
    const config = JSON.parse(
      fs.readFileSync(configPath, 'utf8') || '{}'
    );

    if (!config.rewards) {
      config.rewards = {};
    }

    if (!config.roles) {
      config.roles = {};
    }

    if (!config.rewards.daily) {
      config.rewards.daily = {
        min: 100,
        max: 2000
      };
    }

    if (!config.rewards.weekly) {
      config.rewards.weekly = {
        min: 1000,
        max: 10000
      };
    }

    if (!config.rewards.monthly) {
      config.rewards.monthly = {
        min: 5000,
        max: 50000
      };
    }

    return config;
  } catch (error) {
    console.error('Impossible de lire economyConfig.json :', error);

    return {
      rewards: {
        daily: {
          min: 100,
          max: 2000
        },
        weekly: {
          min: 1000,
          max: 10000
        },
        monthly: {
          min: 5000,
          max: 50000
        }
      },
      roles: {}
    };
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(
      configPath,
      JSON.stringify(config, null, 2)
    );
  } catch (error) {
    console.error('Impossible de sauvegarder economyConfig.json :', error);
  }
}

function getUser(userId) {
  const data = loadData();

  if (!data[userId]) {
    data[userId] = {
      cash: 0,
      bank: 0,
      totalEarned: 0,

      lastDaily: 0,
      lastWeekly: 0,
      lastMonthly: 0,
      lastWork: 0,
      lastRob: 0,

      dailyStreak: 0,
      weeklyStreak: 0,
      monthlyStreak: 0,

      inventory: [],

      stats: {
        workCount: 0,
        dailyCount: 0,
        weeklyCount: 0,
        monthlyCount: 0,
        robSuccess: 0,
        robFailed: 0,
        successfulRobberies: 0,
        failedRobberies: 0,
        timesRobbed: 0,
        slotsWins: 0,
        slotsLosses: 0,
        coinflipWins: 0,
        coinflipLosses: 0
      }
    };

    saveData(data);
  }

  const user = data[userId];

  if (typeof user.cash !== 'number') user.cash = 0;
  if (typeof user.bank !== 'number') user.bank = 0;
  if (typeof user.totalEarned !== 'number') user.totalEarned = 0;

  if (typeof user.lastDaily !== 'number') user.lastDaily = 0;
  if (typeof user.lastWeekly !== 'number') user.lastWeekly = 0;
  if (typeof user.lastMonthly !== 'number') user.lastMonthly = 0;
  if (typeof user.lastWork !== 'number') user.lastWork = 0;
  if (typeof user.lastRob !== 'number') user.lastRob = 0;

  if (typeof user.dailyStreak !== 'number') user.dailyStreak = 0;
  if (typeof user.weeklyStreak !== 'number') user.weeklyStreak = 0;
  if (typeof user.monthlyStreak !== 'number') user.monthlyStreak = 0;

  if (!Array.isArray(user.inventory)) {
    user.inventory = [];
  }

  if (!user.stats || typeof user.stats !== 'object') {
    user.stats = {};
  }

  const defaultStats = {
    workCount: 0,
    dailyCount: 0,
    weeklyCount: 0,
    monthlyCount: 0,
    robSuccess: 0,
    robFailed: 0,
    successfulRobberies: 0,
    failedRobberies: 0,
    timesRobbed: 0,
    slotsWins: 0,
    slotsLosses: 0,
    coinflipWins: 0,
    coinflipLosses: 0
  };

  for (const [key, value] of Object.entries(defaultStats)) {
    if (typeof user.stats[key] !== 'number') {
      user.stats[key] = value;
    }
  }

  return user;
}

function updateUser(userId, changes) {
  const data = loadData();

  const current = getUser(userId);

  data[userId] = {
    ...current,
    ...changes
  };

  saveData(data);

  return data[userId];
}

function addCash(userId, amount) {
  const user = getUser(userId);

  user.cash += amount;
  user.totalEarned += Math.max(0, amount);

  updateUser(userId, user);

  return user;
}

function removeCash(userId, amount) {
  const user = getUser(userId);

  if (user.cash < amount) {
    return false;
  }

  user.cash -= amount;

  updateUser(userId, user);

  return user;
}

function deposit(userId, amount) {
  const user = getUser(userId);

  if (user.cash < amount) {
    return false;
  }

  user.cash -= amount;
  user.bank += amount;

  updateUser(userId, user);

  return user;
}

function withdraw(userId, amount) {
  const user = getUser(userId);

  if (user.bank < amount) {
    return false;
  }

  user.bank -= amount;
  user.cash += amount;

  updateUser(userId, user);

  return user;
}

function transfer(fromId, toId, amount) {
  const fromUser = getUser(fromId);

  if (fromUser.cash < amount) {
    return false;
  }

  fromUser.cash -= amount;
  updateUser(fromId, fromUser);

  const toUser = getUser(toId);

  toUser.cash += amount;
  updateUser(toId, toUser);

  return true;
}

function getLeaderboard(limit = 10) {
  const data = loadData();

  return Object.entries(data)
    .filter(([id, user]) => {
      return user &&
        typeof user === 'object' &&
        typeof user.cash === 'number' &&
        typeof user.bank === 'number';
    })
    .map(([id, user]) => ({
      id,
      total: (user.cash || 0) + (user.bank || 0),
      cash: user.cash || 0,
      bank: user.bank || 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function getUserData(userId) {
  return getUser(userId);
}

function updateStats(userId, statName, increment = 1) {
  const user = getUser(userId);

  if (!user.stats) {
    user.stats = {};
  }

  user.stats[statName] =
    (user.stats[statName] || 0) + increment;

  updateUser(userId, user);

  return user;
}

function getStats(userId) {
  const user = getUser(userId);

  return {
    cash: user.cash,
    bank: user.bank,
    total: user.cash + user.bank,
    totalEarned: user.totalEarned || 0,

    workCount: user.stats?.workCount || 0,
    dailyCount: user.stats?.dailyCount || 0,
    weeklyCount: user.stats?.weeklyCount || 0,
    monthlyCount: user.stats?.monthlyCount || 0,

    robSuccess: user.stats?.robSuccess || 0,
    robFailed: user.stats?.robFailed || 0
  };
}

function getUserStats(userId) {
  const user = getUser(userId);

  return {
    level:
      Math.floor((user.stats?.workCount || 0) / 10) + 1,

    workCount:
      user.stats?.workCount || 0,

    dailyCount:
      user.stats?.dailyCount || 0,

    weeklyCount:
      user.stats?.weeklyCount || 0,

    monthlyCount:
      user.stats?.monthlyCount || 0,

    successfulRobberies:
      user.stats?.successfulRobberies || 0,

    failedRobberies:
      user.stats?.failedRobberies || 0,

    timesRobbed:
      user.stats?.timesRobbed || 0,

    slotsWins:
      user.stats?.slotsWins || 0,

    slotsLosses:
      user.stats?.slotsLosses || 0,

    coinflipWins:
      user.stats?.coinflipWins || 0,

    coinflipLosses:
      user.stats?.coinflipLosses || 0,

    total:
      user.cash + user.bank,

    totalEarned:
      user.totalEarned || 0
  };
}

function getRewardConfig(type) {
  const config = loadConfig();

  return config.rewards[type] || {
    min: 0,
    max: 0
  };
}

function setRewardConfig(type, min, max) {
  if (!['daily', 'weekly', 'monthly'].includes(type)) {
    return false;
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return false;
  }

  if (min < 0 || max < min) {
    return false;
  }

  const config = loadConfig();

  config.rewards[type] = {
    min,
    max
  };

  saveConfig(config);

  return config.rewards[type];
}

function getRandomReward(type) {
  const reward = getRewardConfig(type);

  const min = Math.ceil(reward.min);
  const max = Math.floor(reward.max);

  if (max < min) {
    return 0;
  }

  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function getEconomyRoles() {
  const config = loadConfig();

  return config.roles || {};
}

function addEconomyRole(guildId, roleId, bonus = 0) {
  const config = loadConfig();

  if (!config.roles) {
    config.roles = {};
  }

  if (!config.roles[guildId]) {
    config.roles[guildId] = {};
  }

  config.roles[guildId][roleId] = {
    bonus: Number(bonus) || 0
  };

  saveConfig(config);

  return config.roles[guildId][roleId];
}

function removeEconomyRole(guildId, roleId) {
  const config = loadConfig();

  if (!config.roles?.[guildId]?.[roleId]) {
    return false;
  }

  delete config.roles[guildId][roleId];

  if (!Object.keys(config.roles[guildId]).length) {
    delete config.roles[guildId];
  }

  saveConfig(config);

  return true;
}

function getGuildEconomyRoles(guildId) {
  const config = loadConfig();

  return config.roles?.[guildId] || {};
}

function getRoleBonus(guildId, roleIds = []) {
  const roles = getGuildEconomyRoles(guildId);

  let bonus = 0;

  for (const roleId of roleIds) {
    const role = roles[roleId];

    if (!role) continue;

    if (typeof role.bonus === 'number') {
      bonus = Math.max(bonus, role.bonus);
    }
  }

  return bonus;
}

function applyRoleBonus(amount, bonus) {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  if (!Number.isFinite(bonus) || bonus <= 0) {
    return amount;
  }

  return Math.floor(
    amount + (amount * bonus / 100)
  );
}

function resetUser(userId) {
  const data = loadData();

  if (!data[userId]) {
    return false;
  }

  data[userId] = {
    cash: 0,
    bank: 0,
    totalEarned: 0,

    lastDaily: 0,
    lastWeekly: 0,
    lastMonthly: 0,
    lastWork: 0,
    lastRob: 0,

    dailyStreak: 0,
    weeklyStreak: 0,
    monthlyStreak: 0,

    inventory: [],

    stats: {
      workCount: 0,
      dailyCount: 0,
      weeklyCount: 0,
      monthlyCount: 0,
      robSuccess: 0,
      robFailed: 0,
      successfulRobberies: 0,
      failedRobberies: 0,
      timesRobbed: 0,
      slotsWins: 0,
      slotsLosses: 0,
      coinflipWins: 0,
      coinflipLosses: 0
    }
  };

  saveData(data);

  return true;
}

function resetAllUsers() {
  const data = loadData();

  let count = 0;

  for (const userId of Object.keys(data)) {
    data[userId] = {
      cash: 0,
      bank: 0,
      totalEarned: 0,

      lastDaily: 0,
      lastWeekly: 0,
      lastMonthly: 0,
      lastWork: 0,
      lastRob: 0,

      dailyStreak: 0,
      weeklyStreak: 0,
      monthlyStreak: 0,

      inventory: [],

      stats: {
        workCount: 0,
        dailyCount: 0,
        weeklyCount: 0,
        monthlyCount: 0,
        robSuccess: 0,
        robFailed: 0,
        successfulRobberies: 0,
        failedRobberies: 0,
        timesRobbed: 0,
        slotsWins: 0,
        slotsLosses: 0,
        coinflipWins: 0,
        coinflipLosses: 0
      }
    };

    count++;
  }

  saveData(data);

  return count;
}

module.exports = {
  getUser,
  updateUser,

  addCash,
  removeCash,

  deposit,
  withdraw,
  transfer,

  getLeaderboard,

  getUserData,
  updateStats,
  getStats,
  getUserStats,

  getRewardConfig,
  setRewardConfig,
  getRandomReward,

  getEconomyRoles,
  getGuildEconomyRoles,
  addEconomyRole,
  removeEconomyRole,
  getRoleBonus,
  applyRoleBonus,

  resetUser,
  resetAllUsers,

  loadData,
  saveData
};
