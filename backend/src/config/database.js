/**
 * PayFence Database Configuration & Connection Manager
 * Zero-dependency JSON/in-memory datastore with optional MongoDB Atlas support.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = path.resolve(__dirname, '../../data');
export const STORE_FILE = path.join(DATA_DIR, 'store.json');

let dbState = {
  type: 'local-json',
  status: 'disconnected',
  uri: null,
  error: null
};

/**
 * Initializes the database storage system.
 * Defaults to zero-dependency local JSON file / memory.
 * Attempts MongoDB Atlas connection only if MONGODB_URI is provided.
 */
export async function initDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      // Attempt dynamic import of mongodb if installed
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 5000
      });
      await client.connect();
      dbState = {
        type: 'mongodb',
        status: 'connected',
        uri: mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
        error: null,
        client
      };
      console.log('[PayFence Datastore] Connected to MongoDB Atlas successfully.');
      return dbState;
    } catch (err) {
      console.warn(
        `[PayFence Datastore] MongoDB connection failed (${err.message}). Falling back to zero-dependency local JSON store.`
      );
      dbState = {
        type: 'local-json',
        status: 'fallback-connected',
        uri: null,
        error: err.message
      };
    }
  }

  // Ensure data directory exists
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbState = {
      type: 'local-json',
      status: 'connected',
      filePath: STORE_FILE,
      error: null
    };
    console.log(`[PayFence Datastore] Zero-dependency JSON store active at: ${STORE_FILE}`);
  } catch (err) {
    console.warn(`[PayFence Datastore] Filesystem unavailable, using in-memory store: ${err.message}`);
    dbState = {
      type: 'in-memory',
      status: 'connected',
      error: null
    };
  }

  return dbState;
}

export function getDatabaseStatus() {
  return { ...dbState };
}
