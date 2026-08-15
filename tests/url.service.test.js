import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, setDb } from '../src/db/database.js';
import { UrlRepository } from '../src/repositories/url.repository.js';
import { UrlService } from '../src/services/url.service.js';
import { ValidationError, NotFoundError, ConflictError, ExpiredError } from '../src/utils/errors.js';

describe('UrlService Unit Tests', () => {
  let db;
  let repository;
  let service;

  beforeEach(() => {
    // Fresh in-memory database for complete isolation
    db = initDatabase(':memory:');
    setDb(db);
    repository = new UrlRepository(db);
    service = new UrlService(repository);
  });

  describe('createShortUrl', () => {
    it('should create a short URL with auto-generated 6-character code', () => {
      const result = service.createShortUrl({
        original_url: 'https://example.com/long/path',
      });

      assert.ok(result.id > 0);
      assert.equal(result.original_url, 'https://example.com/long/path');
      assert.equal(result.short_code.length, 6);
      assert.equal(result.clicks, 0);
      assert.equal(result.expires_at, null);
      assert.ok(result.created_at);
    });

    it('should create a short URL with a custom alias', () => {
      const result = service.createShortUrl({
        original_url: 'https://example.com/article/42',
        custom_alias: 'article-42',
      });

      assert.equal(result.short_code, 'article-42');
      assert.equal(result.original_url, 'https://example.com/article/42');
    });

    it('should reject duplicate custom alias', () => {
      service.createShortUrl({
        original_url: 'https://example.com/page-1',
        custom_alias: 'duplicate-me',
      });

      assert.throws(
        () => {
          service.createShortUrl({
            original_url: 'https://example.com/page-2',
            custom_alias: 'duplicate-me',
          });
        },
        (err) => {
          assert.ok(err instanceof ConflictError);
          assert.equal(err.code, 'ALIAS_ALREADY_EXISTS');
          assert.equal(err.statusCode, 409);
          return true;
        }
      );
    });

    it('should save valid future expiration date', () => {
      const future = new Date(Date.now() + 3600000).toISOString();
      const result = service.createShortUrl({
        original_url: 'https://example.com/temp',
        expires_at: future,
      });

      assert.equal(result.expires_at, future);
    });

    it('should throw ValidationError on invalid URL', () => {
      assert.throws(
        () => {
          service.createShortUrl({ original_url: 'javascript:alert(1)' });
        },
        (err) => {
          assert.ok(err instanceof ValidationError);
          assert.equal(err.code, 'INVALID_URL');
          return true;
        }
      );
    });
  });

  describe('getShortUrl & resolveShortUrl', () => {
    it('should return URL stats without incrementing click count', () => {
      const created = service.createShortUrl({
        original_url: 'https://example.com/stats-test',
        custom_alias: 'stats-test',
      });

      const stats1 = service.getShortUrl('stats-test');
      assert.equal(stats1.clicks, 0);

      const stats2 = service.getShortUrl('stats-test');
      assert.equal(stats2.clicks, 0);
    });

    it('should resolve URL and increment click count on redirection', () => {
      service.createShortUrl({
        original_url: 'https://example.com/target',
        custom_alias: 'redirect-target',
      });

      const target1 = service.resolveShortUrl('redirect-target');
      assert.equal(target1, 'https://example.com/target');

      const statsAfterOne = service.getShortUrl('redirect-target');
      assert.equal(statsAfterOne.clicks, 1);

      const target2 = service.resolveShortUrl('redirect-target');
      assert.equal(target2, 'https://example.com/target');

      const statsAfterTwo = service.getShortUrl('redirect-target');
      assert.equal(statsAfterTwo.clicks, 2);
    });

    it('should throw ExpiredError when resolving expired URL and not increment clicks', () => {
      // Create with expiration
      const oneHourFuture = new Date(Date.now() + 3600000).toISOString();
      service.createShortUrl({
        original_url: 'https://example.com/will-expire',
        custom_alias: 'expired-test',
        expires_at: oneHourFuture,
      });

      // Artificially update expiration date in database to past
      db.prepare('UPDATE urls SET expires_at = ? WHERE short_code = ?').run(
        new Date(Date.now() - 10000).toISOString(),
        'expired-test'
      );

      assert.throws(
        () => {
          service.resolveShortUrl('expired-test');
        },
        (err) => {
          assert.ok(err instanceof ExpiredError);
          assert.equal(err.code, 'URL_EXPIRED');
          assert.equal(err.statusCode, 410);
          return true;
        }
      );

      // Verify clicks was NOT incremented
      const stats = service.getShortUrl('expired-test');
      assert.equal(stats.clicks, 0);
    });

    it('should throw NotFoundError for non-existent code', () => {
      assert.throws(
        () => {
          service.getShortUrl('non-existent');
        },
        (err) => {
          assert.ok(err instanceof NotFoundError);
          assert.equal(err.statusCode, 404);
          return true;
        }
      );

      assert.throws(
        () => {
          service.resolveShortUrl('non-existent');
        },
        (err) => {
          assert.ok(err instanceof NotFoundError);
          assert.equal(err.statusCode, 404);
          return true;
        }
      );
    });
  });

  describe('deleteShortUrl', () => {
    it('should delete existing URL', () => {
      service.createShortUrl({
        original_url: 'https://example.com/to-delete',
        custom_alias: 'delete-me',
      });

      const deleted = service.deleteShortUrl('delete-me');
      assert.equal(deleted, true);

      // Subsequent lookup should fail with 404
      assert.throws(() => service.getShortUrl('delete-me'), NotFoundError);
    });

    it('should throw NotFoundError when deleting non-existent URL', () => {
      assert.throws(
        () => {
          service.deleteShortUrl('unknown-code');
        },
        (err) => {
          assert.ok(err instanceof NotFoundError);
          assert.equal(err.statusCode, 404);
          return true;
        }
      );
    });
  });
});
