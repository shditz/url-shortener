import { RESERVED_ALIASES } from '../constants/reserved-aliases.js';

const ALIAS_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;

/**
 * Validates the original target URL.
 * @param {string} urlStr 
 * @returns {{ valid: boolean, error?: string, code?: string }}
 */
export function validateOriginalUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string' || urlStr.trim() === '') {
    return {
      valid: false,
      code: 'VALIDATION_ERROR',
      error: 'Original URL is required',
    };
  }

  const trimmed = urlStr.trim();

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        code: 'INVALID_URL',
        error: 'Only HTTP and HTTPS URLs are allowed',
      };
    }
    if (!parsed.hostname || parsed.hostname.includes(' ')) {
      return {
        valid: false,
        code: 'INVALID_URL',
        error: 'URL must contain a valid hostname',
      };
    }
    return { valid: true };
  } catch {
    return {
      valid: false,
      code: 'INVALID_URL',
      error: 'Please provide a valid URL',
    };
  }
}

/**
 * Validates the custom alias.
 * @param {string} alias 
 * @returns {{ valid: boolean, error?: string, code?: string }}
 */
export function validateCustomAlias(alias) {
  if (!alias) {
    return { valid: true };
  }

  if (typeof alias !== 'string') {
    return {
      valid: false,
      code: 'INVALID_ALIAS',
      error: 'Custom alias must be a string',
    };
  }

  const trimmed = alias.trim();

  if (trimmed.length < 3 || trimmed.length > 32) {
    return {
      valid: false,
      code: 'INVALID_ALIAS',
      error: 'Custom alias must be between 3 and 32 characters',
    };
  }

  if (!ALIAS_REGEX.test(trimmed)) {
    return {
      valid: false,
      code: 'INVALID_ALIAS',
      error: 'Custom alias may only contain alphanumeric characters, underscores, and hyphens',
    };
  }

  if (RESERVED_ALIASES.has(trimmed.toLowerCase())) {
    return {
      valid: false,
      code: 'INVALID_ALIAS',
      error: 'This custom alias is reserved and cannot be used',
    };
  }

  return { valid: true };
}

/**
 * Validates the expiration date.
 * @param {string|null} expiresAt 
 * @returns {{ valid: boolean, error?: string, code?: string, parsedDate?: string|null }}
 */
export function validateExpiresAt(expiresAt) {
  if (!expiresAt) {
    return { valid: true, parsedDate: null };
  }

  if (typeof expiresAt !== 'string') {
    return {
      valid: false,
      code: 'VALIDATION_ERROR',
      error: 'Expiration must be a valid ISO date string',
    };
  }

  const dateObj = new Date(expiresAt);
  const timeMs = dateObj.getTime();

  if (isNaN(timeMs)) {
    return {
      valid: false,
      code: 'VALIDATION_ERROR',
      error: 'Invalid expiration date format',
    };
  }

  if (timeMs <= Date.now()) {
    return {
      valid: false,
      code: 'VALIDATION_ERROR',
      error: 'Expiration date must be in the future',
    };
  }

  return { valid: true, parsedDate: dateObj.toISOString() };
}
