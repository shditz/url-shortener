import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { createApp } from '../src/app.js';
import { initDatabase, setDb } from '../src/db/database.js';

describe('HTTP API End-to-End Tests', () => {
  let server;
  let baseUrl;
  let db;

  before(async () => {
    // Isolated in-memory database for API test suite
    db = initDatabase(':memory:');
    setDb(db);

    const app = createApp();
    server = http.createServer(app);

    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('GET /health', () => {
    it('should return 200 OK with health status', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.deepEqual(body, {
        success: true,
        data: { status: 'ok' },
      });
    });
  });

  describe('POST /api/urls', () => {
    it('should create short URL with auto-generated code', async () => {
      const res = await fetch(`${baseUrl}/api/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: 'https://github.com/developer/project',
        }),
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.original_url, 'https://github.com/developer/project');
      assert.equal(json.data.short_code.length, 6);
      assert.equal(json.data.clicks, 0);
      assert.equal(json.data.expires_at, null);
    });

    it('should create short URL with custom alias and future expiration', async () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const res = await fetch(`${baseUrl}/api/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: 'https://news.ycombinator.com',
          custom_alias: 'hackernews',
          expires_at: future,
        }),
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.short_code, 'hackernews');
      assert.equal(json.data.expires_at, future);
    });

    it('should return 409 Conflict when creating existing alias', async () => {
      const res = await fetch(`${baseUrl}/api/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: 'https://news.ycombinator.com/best',
          custom_alias: 'hackernews',
        }),
      });

      assert.equal(res.status, 409);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'ALIAS_ALREADY_EXISTS');
    });

    it('should return 400 Bad Request on dangerous or invalid URL', async () => {
      const res = await fetch(`${baseUrl}/api/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: 'javascript:alert("hacked")',
        }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'INVALID_URL');
    });
  });

  describe('GET /api/urls/:code (Read Stats)', () => {
    it('should return stats and metadata without incrementing clicks', async () => {
      const res = await fetch(`${baseUrl}/api/urls/hackernews`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.short_code, 'hackernews');
      assert.equal(json.data.clicks, 0);

      // Call again to verify clicks remain 0
      const res2 = await fetch(`${baseUrl}/api/urls/hackernews`);
      const json2 = await res2.json();
      assert.equal(json2.data.clicks, 0);
    });

    it('should return 404 for unknown short code', async () => {
      const res = await fetch(`${baseUrl}/api/urls/unknown-code`);
      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'URL_NOT_FOUND');
    });
  });

  describe('GET /:code (Redirect)', () => {
    it('should redirect (302 Found) to target URL and increment click count', async () => {
      // Create fresh URL
      const createRes = await fetch(`${baseUrl}/api/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: 'https://example.com/redirect-test',
          custom_alias: 'redir-test',
        }),
      });
      assert.equal(createRes.status, 201);

      // Perform redirect request with redirect: 'manual' to inspect 302
      const redirectRes = await fetch(`${baseUrl}/redir-test`, {
        redirect: 'manual',
      });

      assert.equal(redirectRes.status, 302);
      assert.equal(redirectRes.headers.get('location'), 'https://example.com/redirect-test');

      // Check that clicks count incremented to 1
      const statsRes = await fetch(`${baseUrl}/api/urls/redir-test`);
      const stats = await statsRes.json();
      assert.equal(stats.data.clicks, 1);
    });

    it('should return 410 Gone when accessing expired short URL', async () => {
      // Create URL with future expiration
      const future = new Date(Date.now() + 60000).toISOString();
      await fetch(`${baseUrl}/api/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: 'https://example.com/expiring',
          custom_alias: 'expiring-api-test',
          expires_at: future,
        }),
      });

      // Manually set expiration in DB to past
      db.prepare('UPDATE urls SET expires_at = ? WHERE short_code = ?').run(
        new Date(Date.now() - 1000).toISOString(),
        'expiring-api-test'
      );

      const res = await fetch(`${baseUrl}/expiring-api-test`, {
        headers: { Accept: 'application/json' },
      });
      assert.equal(res.status, 410);
      const json = await res.json();
      assert.equal(json.error.code, 'URL_EXPIRED');
    });

    it('should return 404 Not Found for non-existent short code', async () => {
      const res = await fetch(`${baseUrl}/non-existent-link`, {
        headers: { Accept: 'application/json' },
      });
      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.error.code, 'URL_NOT_FOUND');
    });
  });

  describe('DELETE /api/urls/:code', () => {
    it('should delete short URL and return 204 No Content', async () => {
      await fetch(`${baseUrl}/api/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: 'https://example.com/temp-delete',
          custom_alias: 'delete-api-test',
        }),
      });

      const delRes = await fetch(`${baseUrl}/api/urls/delete-api-test`, {
        method: 'DELETE',
      });
      assert.equal(delRes.status, 204);

      // Verify it no longer exists
      const checkRes = await fetch(`${baseUrl}/api/urls/delete-api-test`);
      assert.equal(checkRes.status, 404);
    });

    it('should return 404 when deleting non-existent URL', async () => {
      const delRes = await fetch(`${baseUrl}/api/urls/not-here`, {
        method: 'DELETE',
      });
      assert.equal(delRes.status, 404);
      const json = await delRes.json();
      assert.equal(json.error.code, 'URL_NOT_FOUND');
    });
  });
});
