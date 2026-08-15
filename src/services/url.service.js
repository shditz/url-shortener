import { urlRepository } from '../repositories/url.repository.js';
import { generateShortCode } from '../utils/short-code.js';
import { validateOriginalUrl, validateCustomAlias, validateExpiresAt } from '../utils/url-validator.js';
import { isExpired, toIsoUtcString } from '../utils/date.js';
import { AppError, ValidationError, NotFoundError, ConflictError, ExpiredError } from '../utils/errors.js';
import { config } from '../config/env.js';

export class UrlService {
  /**
   * @param {import('../repositories/url.repository.js').UrlRepository} [repository]
   */
  constructor(repository = urlRepository) {
    this.repository = repository;
  }

  /**
   * Format a database record to the public API contract.
   * @param {Object} record 
   * @returns {Object}
   */
  formatUrlData(record) {
    return {
      id: record.id,
      original_url: record.original_url,
      short_code: record.short_code,
      short_url: `${config.baseUrl}/${record.short_code}`,
      clicks: record.clicks,
      expires_at: record.expires_at,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  /**
   * Create a new short URL.
   * @param {Object} payload 
   * @param {string} payload.original_url 
   * @param {string} [payload.custom_alias] 
   * @param {string|null} [payload.expires_at] 
   * @returns {Object}
   */
  createShortUrl(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new ValidationError('Invalid request body');
    }

    const { original_url, custom_alias, expires_at } = payload;

    // 1. Validate Original URL
    const urlValidation = validateOriginalUrl(original_url);
    if (!urlValidation.valid) {
      throw new ValidationError(urlValidation.error, urlValidation.code);
    }

    // 2. Validate Custom Alias (if provided)
    let shortCode = custom_alias ? custom_alias.trim() : '';
    if (shortCode) {
      const aliasValidation = validateCustomAlias(shortCode);
      if (!aliasValidation.valid) {
        throw new ValidationError(aliasValidation.error, aliasValidation.code);
      }

      if (this.repository.existsByShortCode(shortCode)) {
        throw new ConflictError('Custom alias is already in use', 'ALIAS_ALREADY_EXISTS');
      }
    } else {
      // 3. Generate Unique Random Short Code
      const maxAttempts = 10;
      let attempts = 0;
      let generated = '';

      while (attempts < maxAttempts) {
        generated = generateShortCode(6);
        if (!this.repository.existsByShortCode(generated)) {
          shortCode = generated;
          break;
        }
        attempts++;
      }

      if (!shortCode) {
        throw new AppError('INTERNAL_SERVER_ERROR', 'Failed to generate unique short code. Please try again.', 500);
      }
    }

    // 4. Validate Expiration (if provided)
    const expirationValidation = validateExpiresAt(expires_at);
    if (!expirationValidation.valid) {
      throw new ValidationError(expirationValidation.error, expirationValidation.code);
    }

    const now = toIsoUtcString();
    const createdRecord = this.repository.create({
      original_url: original_url.trim(),
      short_code: shortCode,
      expires_at: expirationValidation.parsedDate,
      created_at: now,
      updated_at: now,
    });

    return this.formatUrlData(createdRecord);
  }

  /**
   * Get short URL statistics and details without incrementing clicks.
   * @param {string} shortCode 
   * @returns {Object}
   */
  getShortUrl(shortCode) {
    if (!shortCode || typeof shortCode !== 'string') {
      throw new NotFoundError('Short URL not found');
    }

    const record = this.repository.findByShortCode(shortCode.trim());
    if (!record) {
      throw new NotFoundError('Short URL not found');
    }

    return this.formatUrlData(record);
  }

  /**
   * Resolve a short URL for redirect and atomically increment its click counter.
   * @param {string} shortCode 
   * @returns {string} Original target URL
   */
  resolveShortUrl(shortCode) {
    if (!shortCode || typeof shortCode !== 'string') {
      throw new NotFoundError('Short URL not found');
    }

    const record = this.repository.findByShortCode(shortCode.trim());
    if (!record) {
      throw new NotFoundError('Short URL not found');
    }

    if (isExpired(record.expires_at)) {
      throw new ExpiredError('This short URL has expired');
    }

    // Atomic increment
    this.repository.incrementClicks(record.short_code, toIsoUtcString());

    return record.original_url;
  }

  /**
   * Delete a short URL.
   * @param {string} shortCode 
   */
  deleteShortUrl(shortCode) {
    if (!shortCode || typeof shortCode !== 'string') {
      throw new NotFoundError('Short URL not found');
    }

    const deleted = this.repository.deleteByShortCode(shortCode.trim());
    if (!deleted) {
      throw new NotFoundError('Short URL not found');
    }

    return true;
  }
}

export const urlService = new UrlService();
