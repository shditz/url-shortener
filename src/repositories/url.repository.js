import { getDb } from '../db/database.js';

export class UrlRepository {
  /**
   * @param {import('better-sqlite3').Database} [db]
   */
  constructor(db = null) {
    this._db = db;
  }

  get db() {
    return this._db || getDb();
  }

  /**
   * Insert a new URL entry.
   * @param {Object} data
   * @param {string} data.original_url
   * @param {string} data.short_code
   * @param {string|null} data.expires_at
   * @param {string} data.created_at
   * @param {string} data.updated_at
   * @returns {Object} Created record
   */
  create({ original_url, short_code, expires_at, created_at, updated_at }) {
    const stmt = this.db.prepare(`
      INSERT INTO urls (original_url, short_code, clicks, expires_at, created_at, updated_at)
      VALUES (?, ?, 0, ?, ?, ?)
    `);

    const info = stmt.run(original_url, short_code, expires_at, created_at, updated_at);
    return {
      id: Number(info.lastInsertRowid),
      original_url,
      short_code,
      clicks: 0,
      expires_at,
      created_at,
      updated_at,
    };
  }

  /**
   * Find a URL by its short code.
   * @param {string} shortCode 
   * @returns {Object|null}
   */
  findByShortCode(shortCode) {
    const stmt = this.db.prepare('SELECT * FROM urls WHERE short_code = ?');
    const row = stmt.get(shortCode);
    return row || null;
  }

  /**
   * Check if a short code exists.
   * @param {string} shortCode 
   * @returns {boolean}
   */
  existsByShortCode(shortCode) {
    const stmt = this.db.prepare('SELECT 1 FROM urls WHERE short_code = ? LIMIT 1');
    const row = stmt.get(shortCode);
    return Boolean(row);
  }

  /**
   * Atomically increment the click count of a short URL.
   * @param {string} shortCode 
   * @param {string} updatedAt 
   * @returns {boolean} True if updated, false if not found
   */
  incrementClicks(shortCode, updatedAt) {
    const stmt = this.db.prepare(`
      UPDATE urls 
      SET clicks = clicks + 1, updated_at = ? 
      WHERE short_code = ?
    `);
    const info = stmt.run(updatedAt, shortCode);
    return info.changes > 0;
  }

  /**
   * Delete a URL by its short code.
   * @param {string} shortCode 
   * @returns {boolean} True if deleted, false if not found
   */
  deleteByShortCode(shortCode) {
    const stmt = this.db.prepare('DELETE FROM urls WHERE short_code = ?');
    const info = stmt.run(shortCode);
    return info.changes > 0;
  }
}

export const urlRepository = new UrlRepository();
