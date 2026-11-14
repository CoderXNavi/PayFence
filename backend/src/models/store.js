/**
 * PayFence In-Memory & File-Backed Zero-Dependency Store
 * Persists users, security policies, audit logs, and spending tracking.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { DATA_DIR, STORE_FILE } from '../config/database.js';
import { DEFAULT_POLICY, getDefaultPolicy } from '../services/guard/defaultPolicy.js';

// Pre-computed bcrypt hash for 'password123' to enable instant startup
const DEMO_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

const INITIAL_STATE = () => ({
  users: {
    usr_demo_01: {
      id: 'usr_demo_01',
      email: 'demo@payfence.io',
      name: 'PayFence Autonomous Agent Operator',
      role: 'operator',
      passwordHash: DEMO_PASSWORD_HASH,
      balanceUSD: 500.00,
      balanceUnits: 5000000,
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  },
  policies: {
    default: getDefaultPolicy()
  },
  auditLogs: [],
  dailySpending: {
    usr_demo_01: {}
  }
});

let memoryStore = INITIAL_STATE();
let isInitialized = false;

function loadStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      memoryStore = {
        users: { ...INITIAL_STATE().users, ...(parsed.users || {}) },
        policies: { default: getDefaultPolicy(), ...(parsed.policies || {}) },
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
        dailySpending: parsed.dailySpending || { usr_demo_01: {} }
      };
      return;
    }
  } catch (err) {
    console.warn(`[PayFence Store] Could not read store from disk, initializing in-memory: ${err.message}`);
  }

  memoryStore = INITIAL_STATE();
  persistStore();
}

function persistStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${STORE_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(memoryStore, null, 2), 'utf-8');
    fs.renameSync(tempFile, STORE_FILE);
  } catch (err) {
    // If filesystem write fails, keep memory store intact
  }
}

export function initStore() {
  if (!isInitialized) {
    loadStore();
    isInitialized = true;
  }
  return memoryStore;
}

// User Methods
export function getUserById(id) {
  initStore();
  return memoryStore.users[id] ? { ...memoryStore.users[id] } : null;
}

export function getUserByEmail(email) {
  initStore();
  const normalized = email.toLowerCase().trim();
  const user = Object.values(memoryStore.users).find(
    (u) => u.email.toLowerCase() === normalized
  );
  return user ? { ...user } : null;
}

export function createUser(userData) {
  initStore();
  const id = userData.id || `usr_${crypto.randomBytes(6).toString('hex')}`;
  const newUser = {
    id,
    email: userData.email,
    name: userData.name || 'User',
    role: userData.role || 'operator',
    passwordHash: userData.passwordHash || bcrypt.hashSync(userData.password || 'password123', 10),
    balanceUSD: typeof userData.balanceUSD === 'number' ? userData.balanceUSD : 500.00,
    balanceUnits: typeof userData.balanceUnits === 'number' ? userData.balanceUnits : 5000000,
    createdAt: new Date().toISOString()
  };
  memoryStore.users[id] = newUser;
  persistStore();
  return { ...newUser };
}

export function updateUserBalance(userId, newBalanceUSD) {
  initStore();
  if (!memoryStore.users[userId]) return null;
  memoryStore.users[userId].balanceUSD = Number(newBalanceUSD.toFixed(2));
  memoryStore.users[userId].balanceUnits = Math.round(newBalanceUSD * 10000);
  persistStore();
  return { ...memoryStore.users[userId] };
}

// Policy Methods
export function getPolicy(policyId = 'default') {
  initStore();
  return memoryStore.policies[policyId]
    ? JSON.parse(JSON.stringify(memoryStore.policies[policyId]))
    : JSON.parse(JSON.stringify(DEFAULT_POLICY));
}

export function updatePolicy(policyId = 'default', updates = {}) {
  initStore();
  const current = memoryStore.policies[policyId] || getDefaultPolicy();
  const updated = {
    ...current,
    ...updates,
    policyId,
    updatedAt: new Date().toISOString()
  };

  // Recalculate units if USD values were provided
  if (typeof updates.perTxCapUSD === 'number') {
    updated.perTxCapUnits = Math.round(updates.perTxCapUSD * 10000);
  }
  if (typeof updates.dailyBudgetUSD === 'number') {
    updated.dailyBudgetUnits = Math.round(updates.dailyBudgetUSD * 10000);
  }
  if (typeof updates.mockBalanceUSD === 'number') {
    updated.mockBalanceUnits = Math.round(updates.mockBalanceUSD * 10000);
  }

  memoryStore.policies[policyId] = updated;
  persistStore();
  return JSON.parse(JSON.stringify(updated));
}

export function resetPolicy(policyId = 'default') {
  initStore();
  const reset = getDefaultPolicy();
  reset.policyId = policyId;
  memoryStore.policies[policyId] = reset;
  persistStore();
  return JSON.parse(JSON.stringify(reset));
}

// Audit Logs Methods
export function addAuditLog(entry) {
  initStore();
  const log = {
    id: entry.id || `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    timestamp: entry.timestamp || new Date().toISOString(),
    action: entry.action || (entry.allowed ? 'ALLOW' : 'BLOCK'),
    allowed: Boolean(entry.allowed),
    category: entry.category || 'General',
    violationCode: entry.violationCode || null,
    reason: entry.reason || '',
    recipient: entry.recipient || null,
    amountUSD: entry.amountUSD || null,
    origin: entry.origin || null,
    userId: entry.userId || null,
    details: entry.details || null
  };
  memoryStore.auditLogs.unshift(log);
  // Cap at 1000 logs in storage
  if (memoryStore.auditLogs.length > 1000) {
    memoryStore.auditLogs = memoryStore.auditLogs.slice(0, 1000);
  }
  persistStore();
  return log;
}

export function getAuditLogs({ limit = 50, offset = 0, category, allowed } = {}) {
  initStore();
  let logs = [...memoryStore.auditLogs];
  if (category) {
    logs = logs.filter((l) => l.category.toLowerCase() === category.toLowerCase());
  }
  if (typeof allowed === 'boolean') {
    logs = logs.filter((l) => l.allowed === allowed);
  }
  return {
    total: logs.length,
    offset,
    limit,
    logs: logs.slice(offset, offset + limit)
  };
}

export function clearAuditLogs() {
  initStore();
  memoryStore.auditLogs = [];
  persistStore();
  return { success: true };
}

// Daily Spending Methods
function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function getDailySpending(userId = 'usr_demo_01', dateStr = null) {
  initStore();
  const dateKey = dateStr || getTodayDateKey();
  if (!memoryStore.dailySpending[userId]) {
    memoryStore.dailySpending[userId] = {};
  }
  return memoryStore.dailySpending[userId][dateKey] || 0.00;
}

export function recordDailySpending(userId = 'usr_demo_01', amountUSD = 0, dateStr = null) {
  initStore();
  const dateKey = dateStr || getTodayDateKey();
  if (!memoryStore.dailySpending[userId]) {
    memoryStore.dailySpending[userId] = {};
  }
  const current = memoryStore.dailySpending[userId][dateKey] || 0.00;
  const updated = Number((current + amountUSD).toFixed(2));
  memoryStore.dailySpending[userId][dateKey] = updated;
  persistStore();
  return updated;
}

export function resetDailySpending(userId = 'usr_demo_01', dateStr = null) {
  initStore();
  const dateKey = dateStr || getTodayDateKey();
  if (memoryStore.dailySpending[userId]) {
    memoryStore.dailySpending[userId][dateKey] = 0.00;
    persistStore();
  }
  return 0.00;
}

// Reset store for tests
export function _resetStoreForTesting() {
  memoryStore = INITIAL_STATE();
  isInitialized = true;
}
