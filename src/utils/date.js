/**
 * Check if an ISO date string is expired compared to the current server time.
 * @param {string|null} expiresAt - ISO 8601 date string or null
 * @returns {boolean}
 */
export function isExpired(expiresAt) {
  if (!expiresAt) {
    return false;
  }
  const expTime = new Date(expiresAt).getTime();
  if (isNaN(expTime)) {
    return false;
  }
  return expTime <= Date.now();
}

/**
 * Format a Date object to ISO 8601 UTC string.
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function toIsoUtcString(date = new Date()) {
  return date.toISOString();
}
