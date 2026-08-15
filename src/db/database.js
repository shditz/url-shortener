import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';

let dbInstance = null;

/**
 * Initialize and migrate the SQLite database.
 * @param {string} [dbPath] - Optional custom path or ':memory:' for tests
 * @returns {Database.Database}
 */
export function initDatabase(dbPath = config.databasePath) {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath);

  // Performance and integrity settings
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create table
  db.exec(`
    CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_url TEXT NOT NULL,
      short_code TEXT NOT NULL UNIQUE,
      clicks INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
  `);

  return db;
}

/**
 * Get or initialize the database singleton.
 * @returns {Database.Database}
 */
export function getDb() {
  if (!dbInstance) {
    dbInstance = initDatabase();
  }
  return dbInstance;
}

/**
 * Set a custom DB instance (useful for test isolation).
 * @param {Database.Database} db
 */
export function setDb(db) {
  dbInstance = db;
}
