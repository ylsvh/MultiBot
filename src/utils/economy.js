const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const filePath = path.join(__dirname, '../../data/economy.json');
const databasePath = path.join(__dirname, '../../data/economy.sqlite');
const configPath = path.join(__dirname, '../../data/economyConfig.json');

const db = new Database(databasePath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS economy (
    user_id TEXT PRIMARY KEY,
    cash INTEGER NOT NULL DEFAULT 0,
    bank INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,

    last_daily INTEGER NOT NULL DEFAULT 0,
    last_weekly INTEGER NOT NULL DEFAULT 0,
    last_monthly INTEGER NOT NULL DEFAULT 0,
    last_work INTEGER NOT NULL DEFAULT 0,
    last_rob INTEGER NOT NULL DEFAULT 0,

    daily_streak INTEGER NOT NULL DEFAULT 0,
    weekly_streak INTEGER NOT NULL DEFAULT 0,
    monthly_streak INTEGER NOT NULL DEFAULT 0,

    inventory TEXT NOT NULL DEFAULT '[]',
    stats TEXT NOT NULL DEFAULT '{}'
  )
`);

const DEFAULT_USER = {
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

const DEFAULT_STATS = {
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

function normalizeUser(user) {
  const normalized = {
    ...DEFAULT_USER,
    ...(user || {})
  };

  normalized.cash =
    typeof normalized.cash === 'number'
      ? normalized.cash
      : 0;

  normalized.bank =
    typeof normalized.bank === 'number'
      ? normalized.bank
      : 0;

  normalized.totalEarned =
    typeof normalized.totalEarned === 'number'
      ? normalized.totalEarned
      : 0;

  normalized.lastDaily =
    typeof normalized.lastDaily === 'number'
      ? normalized.lastDaily
      : 0;

  normalized.lastWeekly =
    typeof normalized.lastWeekly === 'number'
      ? normalized.lastWeekly
      : 0;

  normalized.lastMonthly =
    typeof normalized.lastMonthly === 'number'
      ? normalized.lastMonthly
      : 0;

  normalized.lastWork =
    typeof normalized.lastWork === 'number'
      ? normalized.lastWork
      : 0;

  normalized.lastRob =
    typeof normalized.lastRob === 'number'
      ? normalized.lastRob
      : 0;

  normalized.dailyStreak =
    typeof normalized.dailyStreak === 'number'
      ? normalized.dailyStreak
      : 0;

  normalized.weeklyStreak =
    typeof normalized.weeklyStreak === 'number'
      ? normalized.weeklyStreak
      : 0;

  normalized.monthlyStreak =
    typeof normalized.monthlyStreak === 'number'
      ? normalized.monthlyStreak
      : 0;

  if (!Array.isArray(normalized.inventory)) {
    normalized.inventory = [];
  }

  if (!normalized.stats || typeof normalized.stats !== 'object') {
    normalized.stats = {};
  }

  normalized.stats = {
    ...DEFAULT_STATS,
    ...normalized.stats
  };

  for (const key of Object.keys(DEFAULT_STATS)) {
    if (typeof normalized.stats[key] !== 'number') {
      normalized.stats[key] = DEFAULT_STATS[key];
    }
  }

  return normalized;
}

function migrateEconomy() {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let data;

  try {
    data = JSON.parse(
      fs.readFileSync(filePath, 'utf8') || '{}'
    );
  } catch (error) {
    console.error('Impossible de lire economy.json :', error);
    return;
  }

  if (!data || typeof data !== 'object') {
    return;
  }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO economy (
      user_id,
      cash,
      bank,
      total_earned,
      last_daily,
      last_weekly,
      last_monthly,
      last_work,
      last_rob,
      daily_streak,
      weekly_streak,
      monthly_streak,
      inventory,
      stats
    )
    VALUES (
      @userId,
      @cash,
      @bank,
      @totalEarned,
      @lastDaily,
      @lastWeekly,
      @lastMonthly,
      @lastWork,
      @lastRob,
      @dailyStreak,
      @weeklyStreak,
      @monthlyStreak,
      @inventory,
      @stats
    )
  `);

  const migrate = db.transaction(() => {
    for (const [userId, userData] of Object.entries(data)) {
      const user = normalizeUser(userData);

      insert.run({
        userId,
        cash: user.cash,
        bank: user.bank,
        totalEarned: user.totalEarned,
        lastDaily: user.lastDaily,
        lastWeekly: user.lastWeekly,
        lastMonthly: user.lastMonthly,
        lastWork: user.lastWork,
        lastRob: user.lastRob,
        dailyStreak: user.dailyStreak,
        weeklyStreak: user.weeklyStreak,
        monthlyStreak: user.monthlyStreak,
        inventory: JSON.stringify(user.inventory),
        stats: JSON.stringify(user.stats)
      });
    }
  });

  try {
    migrate();
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('Impossible de terminer la migration de economy.json :', error);
  }
}

migrateEconomy();

const selectUser = db.prepare(`
  SELECT *
  FROM economy
  WHERE user_id = ?
`);

const insertUser = db.prepare(`
  INSERT INTO economy (
    user_id,
    cash,
    bank,
    total_earned,
    last_daily,
    last_weekly,
    last_monthly,
    last_work,
    last_rob,
    daily_streak,
    weekly_streak,
    monthly_streak,
    inventory,
    stats
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateUserQuery = db.prepare(`
  UPDATE economy
  SET
    cash = ?,
    bank = ?,
    total_earned = ?,
    last_daily = ?,
    last_weekly = ?,
    last_monthly = ?,
    last_work = ?,
    last_rob = ?,
    daily_streak = ?,
    weekly_streak = ?,
    monthly_streak = ?,
    inventory = ?,
    stats = ?
  WHERE user_id = ?
`);

function rowToUser(row) {
  if (!row) return null;

  let inventory = [];
  let stats = {};

  try {
    inventory = JSON.parse(row.inventory || '[]');
  } catch {
    inventory = [];
  }

  try {
    stats = JSON.parse(row.stats || '{}');
  } catch {
    stats = {};
  }

  return normalizeUser({
    cash: row.cash,
    bank: row.bank,
    totalEarned: row.total_earned,

    lastDaily: row.last_daily,
    lastWeekly: row.last_weekly,
    lastMonthly: row.last_monthly,
    lastWork: row.last_work,
    lastRob: row.last_rob,

    dailyStreak: row.daily_streak,
    weeklyStreak: row.weekly_streak,
    monthlyStreak: row.monthly_streak,

    inventory,
    stats
  });
}

function saveUser(userId, user) {
  const normalized = normalizeUser(user);

  updateUserQuery.run(
    normalized.cash,
    normalized.bank,
    normalized.totalEarned,

    normalized.lastDaily,
    normalized.lastWeekly,
    normalized.lastMonthly,
    normalized.lastWork,
    normalized.lastRob,

    normalized.dailyStreak,
    normalized.weeklyStreak,
    normalized.monthlyStreak,

    JSON.stringify(normalized.inventory),
    JSON.stringify(normalized.stats),

    userId
  );
}

function loadData() {
  const rows = db.prepare(`
    SELECT *
    FROM economy
  `).all();

  const data = {};

  for (const row of rows) {
    data[row.user_id] = rowToUser(row);
  }

  return data;
}

function saveData(data) {
  if (!data || typeof data !== 'object') {
    return;
  }

  const transaction = db.transaction(() => {
    for (const [userId, userData] of Object.entries(data)) {
      const user = normalizeUser(userData);

      const existing = selectUser.get(userId);

      if (existing) {
        saveUser(userId, user);
      } else {
        insertUser.run(
          userId,
          user.cash,
          user.bank,
          user.totalEarned,

          user.lastDaily,
          user.lastWeekly,
          user.lastMonthly,
          user.lastWork,
          user.lastRob,

          user.dailyStreak,
          user.weeklyStreak,
          user.monthlyStreak,

          JSON.stringify(user.inventory),
          JSON.stringify(user.stats)
        );
      }
    }
  });

  try {
    transaction();
  } catch (error) {
    console.error('Impossible de sauvegarder les données economy :', error);
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
    console.error(
      'Impossible de lire economyConfig.json :',
      error
    );

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
    console.error(
      'Impossible de sauvegarder economyConfig.json :',
      error
    );
  }
}

function getUser(userId) {
  let row = selectUser.get(userId);

  if (!row) {
    const user = normalizeUser(DEFAULT_USER);

    insertUser.run(
      userId,
      user.cash,
      user.bank,
      user.totalEarned,

      user.lastDaily,
      user.lastWeekly,
      user.lastMonthly,
      user.lastWork,
      user.lastRob,

      user.dailyStreak,
      user.weeklyStreak,
      user.monthlyStreak,

      JSON.stringify(user.inventory),
      JSON.stringify(user.stats)
    );

    row = selectUser.get(userId);
  }

  return rowToUser(row);
}

function updateUser(userId, changes) {
  const current = getUser(userId);

  const updated = {
    ...current,
    ...changes
  };

  saveUser(userId, updated);

  return getUser(userId);
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
  const rows = db.prepare(`
    SELECT
      user_id,
      cash,
      bank
    FROM economy
    WHERE typeof(cash) = 'integer'
    AND typeof(bank) = 'integer'
    ORDER BY (cash + bank) DESC
    LIMIT ?
  `).all(limit);

  return rows.map(row => ({
    id: row.user_id,
    total: (row.cash || 0) + (row.bank || 0),
    cash: row.cash || 0,
    bank: row.bank || 0
  }));
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
  const row = selectUser.get(userId);

  if (!row) {
    return false;
  }

  const user = normalizeUser(DEFAULT_USER);

  saveUser(userId, user);

  return true;
}

function resetAllUsers() {
  const result = db.prepare(`
    UPDATE economy
    SET
      cash = 0,
      bank = 0,
      total_earned = 0,
      last_daily = 0,
      last_weekly = 0,
      last_monthly = 0,
      last_work = 0,
      last_rob = 0,
      daily_streak = 0,
      weekly_streak = 0,
      monthly_streak = 0,
      inventory = '[]',
      stats = ?
  `).run(JSON.stringify(DEFAULT_STATS));

  return result.changes;
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
