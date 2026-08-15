import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateOriginalUrl, validateCustomAlias, validateExpiresAt } from '../src/utils/url-validator.js';

describe('Validation Tests', () => {
  describe('URL Validation', () => {
    it('should accept valid HTTPS URL', () => {
      const result = validateOriginalUrl('https://example.com/very/long/path');
      assert.equal(result.valid, true);
    });

    it('should accept valid HTTP URL', () => {
      const result = validateOriginalUrl('http://example.com/test?param=123');
      assert.equal(result.valid, true);
    });

    it('should reject URL with missing protocol', () => {
      const result = validateOriginalUrl('example.com');
      assert.equal(result.valid, false);
      assert.equal(result.code, 'INVALID_URL');
    });

    it('should reject invalid string', () => {
      const result = validateOriginalUrl('not-a-url');
      assert.equal(result.valid, false);
      assert.equal(result.code, 'INVALID_URL');
    });

    it('should reject dangerous javascript: protocol', () => {
      const result = validateOriginalUrl('javascript:alert(1)');
      assert.equal(result.valid, false);
      assert.equal(result.code, 'INVALID_URL');
    });

    it('should reject data: protocol', () => {
      const result = validateOriginalUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==');
      assert.equal(result.valid, false);
      assert.equal(result.code, 'INVALID_URL');
    });

    it('should reject ftp: and file: protocol', () => {
      const ftpResult = validateOriginalUrl('ftp://example.com/file');
      assert.equal(ftpResult.valid, false);
      const fileResult = validateOriginalUrl('file:///etc/passwd');
      assert.equal(fileResult.valid, false);
    });

    it('should reject empty or whitespace URL', () => {
      const result = validateOriginalUrl('   ');
      assert.equal(result.valid, false);
      assert.equal(result.code, 'VALIDATION_ERROR');
    });
  });

  describe('Alias Validation', () => {
    it('should allow undefined or empty alias', () => {
      assert.equal(validateCustomAlias(undefined).valid, true);
      assert.equal(validateCustomAlias('').valid, true);
    });

    it('should accept valid custom alias', () => {
      assert.equal(validateCustomAlias('my-link_123').valid, true);
      assert.equal(validateCustomAlias('article123').valid, true);
    });

    it('should reject alias that is too short (< 3 chars)', () => {
      const result = validateCustomAlias('ab');
      assert.equal(result.valid, false);
      assert.equal(result.code, 'INVALID_ALIAS');
    });

    it('should reject alias that is too long (> 32 chars)', () => {
      const result = validateCustomAlias('a'.repeat(33));
      assert.equal(result.valid, false);
      assert.equal(result.code, 'INVALID_ALIAS');
    });

    it('should reject invalid characters in alias', () => {
      const result = validateCustomAlias('invalid alias with spaces');
      assert.equal(result.valid, false);
      assert.equal(result.code, 'INVALID_ALIAS');

      const specialChar = validateCustomAlias('my$link!');
      assert.equal(specialChar.valid, false);
    });

    it('should reject reserved aliases (case-insensitive)', () => {
      const reserved = ['api', 'API', 'health', 'favicon.ico', 'static', 'css', 'js'];
      for (const alias of reserved) {
        const res = validateCustomAlias(alias);
        assert.equal(res.valid, false);
        assert.equal(res.code, 'INVALID_ALIAS');
      }
    });
  });

  describe('Expiration Validation', () => {
    it('should accept empty or null expiration', () => {
      assert.equal(validateExpiresAt(null).valid, true);
      assert.equal(validateExpiresAt(undefined).valid, true);
    });

    it('should accept future ISO date string', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const result = validateExpiresAt(future);
      assert.equal(result.valid, true);
      assert.equal(typeof result.parsedDate, 'string');
    });

    it('should reject past expiration date', () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      const result = validateExpiresAt(past);
      assert.equal(result.valid, false);
      assert.equal(result.code, 'VALIDATION_ERROR');
    });

    it('should reject malformed date string', () => {
      const result = validateExpiresAt('not-a-date');
      assert.equal(result.valid, false);
      assert.equal(result.code, 'VALIDATION_ERROR');
    });
  });
});
