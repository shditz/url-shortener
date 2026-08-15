import crypto from 'crypto';

const BASE62_CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generate a cryptographically secure random short code.
 * @param {number} length - Length of the short code (default: 6)
 * @returns {string}
 */
export function generateShortCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let result = '';
  const charsetLength = BASE62_CHARSET.length;

  for (let i = 0; i < length; i++) {
    result += BASE62_CHARSET[bytes[i] % charsetLength];
  }

  return result;
}
