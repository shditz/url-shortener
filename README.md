# URL Shortener

[![CI](https://github.com/shditz/url-shortener/actions/workflows/ci.yml/badge.svg)](https://github.com/shditz/url-shortener/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

A fast, minimal URL shortener built with Node.js, Express, and SQLite.

This project provides a complete REST API and a clean web interface for shortening links, tracking clicks, and managing custom aliases and expirations. It is built with zero frontend framework dependencies and uses standard layered architecture on the backend.

---

## Features

- **Short URL Generation**: Automatically generates cryptographically secure 6-character short codes (`[a-zA-Z0-9]`).
- **Custom Aliases**: Supports user-defined aliases (3–32 characters) with collision prevention and reserved keyword protection.
- **URL Expiration**: Configurable ISO 8601 expiration dates. Expired links return `410 Gone`.
- **Atomic Click Tracking**: High-concurrency safe redirect counts incremented directly in SQLite (`UPDATE urls SET clicks = clicks + 1`).
- **RESTful API**: Clean, predictable JSON API with standardized response schemas.
- **Modern Vanilla Frontend**: Responsive dark-mode interface with clipboard copy, real-time analytics lookup, and delete modal confirmation.
- **Robust Security**: Parameterized queries to prevent SQL injection, HTTP security headers, payload size limits, and protocol whitelist (`http:`, `https:` only).
- **Comprehensive Test Suite**: 40+ unit and end-to-end integration tests using Node.js built-in test runner.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js (ES Modules, `"type": "module"`) |
| **Backend Framework** | Express.js |
| **Database** | SQLite via `better-sqlite3` |
| **Frontend** | Vanilla HTML5, CSS3 (CSS Variables & Flex/Grid), Vanilla JavaScript (Fetch API) |
| **Testing** | Node.js built-in test runner (`node:test` & `node:assert`) |

---

## Architecture & Data Flow

The application follows a simple, clean, layered architecture:

```
HTTP Request
     │
     ▼
 Express Router (api.routes.js / redirect.routes.js)
     │
     ▼
 URL Controller (url.controller.js)
     │
     ▼
 URL Service (url.service.js) ──► Validations & Short Code Utils
     │
     ▼
 URL Repository (url.repository.js)
     │
     ▼
 SQLite Database (database.sqlite via better-sqlite3)
```

- **Routes**: Direct incoming HTTP requests to corresponding controller methods.
- **Controllers**: Handle request extraction, HTTP response codes, and JSON formatting.
- **Services**: Enforce business rules (validation, alias uniqueness, expiration validation, retry logic).
- **Repositories**: Execute parameterized SQL queries against SQLite.

---

## Project Structure

```
url-shortener/
├── src/
│   ├── app.js                     # Express app setup and middleware configuration
│   ├── server.js                  # Server startup and graceful shutdown
│   ├── config/
│   │   └── env.js                 # Environment variable loader
│   ├── constants/
│   │   └── reserved-aliases.js    # Protected system route aliases
│   ├── controllers/
│   │   └── url.controller.js      # HTTP request and response handler
│   ├── db/
│   │   └── database.js            # SQLite database initialization & migrations
│   ├── middleware/
│   │   └── error.middleware.js    # Centralized error handler
│   ├── repositories/
│   │   └── url.repository.js      # Direct SQLite database access
│   ├── routes/
│   │   ├── api.routes.js          # REST API route definitions (/api/urls)
│   │   └── redirect.routes.js     # Redirection route definition (/:code)
│   ├── services/
│   │   └── url.service.js         # Business logic and coordination
│   └── utils/
│       ├── date.js                # Date manipulation and expiration helper
│       ├── errors.js              # Custom application error classes
│       ├── short-code.js          # Cryptographic short code generator
│       └── url-validator.js       # Target URL, alias, and date validator
├── public/
│   ├── index.html                 # Main frontend user interface
│   ├── css/
│   │   └── style.css              # Custom CSS design system
│   └── js/
│       └── app.js                 # Vanilla client-side controller
├── tests/
│   ├── api.test.js                # End-to-end HTTP API integration tests
│   ├── url.service.test.js        # Service layer unit tests with isolated in-memory DB
│   └── validation.test.js         # Input validation test suite
├── data/
│   └── .gitkeep                   # Local SQLite database directory
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git ignore rules
├── AGENTS.md                      # AI agent and developer guidelines
├── package.json                   # Project scripts and dependencies
└── README.md                      # Documentation
```

---

## Database Schema

Database is stored at `data/database.sqlite` (auto-created on startup).

```sql
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
```

---

## Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation

1. Clone or download the repository:
   ```bash
   git clone <repo-url>
   cd url-shortener
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure environment variables:
   ```bash
   cp .env.example .env
   ```

### Running the Application

- **Development Mode** (with automatic file reload):
  ```bash
  npm run dev
  ```

- **Production Mode**:
  ```bash
  npm start
  ```

Once started, access the web frontend at `http://localhost:3000`.

### Running with Docker

Start the containerized application with persistent SQLite storage:

```bash
docker compose up -d
```

To view container logs or stop:
```bash
docker compose logs -f
docker compose down
```

---

## Running Tests

Run the full automated test suite (isolated in-memory SQLite):

```bash
npm test
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port for the HTTP server |
| `BASE_URL` | `http://localhost:3000` | Base domain used to construct full short URLs |
| `DATABASE_PATH` | `./data/database.sqlite` | SQLite database file location |
| `NODE_ENV` | `development` | Environment mode (`development` / `production`) |

---

## API Documentation

All API endpoints return JSON. Standardized response wrappers:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable description"
  }
}
```

---

### 1. Create Short URL

- **URL**: `/api/urls`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "original_url": "https://example.com/very/long/path",
  "custom_alias": "my-link",
  "expires_at": "2026-12-31T23:59:59.000Z"
}
```
*Note: `custom_alias` and `expires_at` are optional.*

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "original_url": "https://example.com/very/long/path",
    "short_code": "my-link",
    "short_url": "http://localhost:3000/my-link",
    "clicks": 0,
    "expires_at": "2026-12-31T23:59:59.000Z",
    "created_at": "2026-08-15T10:00:00.000Z",
    "updated_at": "2026-08-15T10:00:00.000Z"
  }
}
```

---

### 2. Get URL Statistics

- **URL**: `/api/urls/:code`
- **Method**: `GET`

*Note: Calling this endpoint does not increment the click counter.*

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "original_url": "https://example.com/very/long/path",
    "short_code": "my-link",
    "short_url": "http://localhost:3000/my-link",
    "clicks": 14,
    "expires_at": "2026-12-31T23:59:59.000Z",
    "created_at": "2026-08-15T10:00:00.000Z",
    "updated_at": "2026-08-15T12:30:00.000Z"
  }
}
```

---

### 3. Delete Short URL

- **URL**: `/api/urls/:code`
- **Method**: `DELETE`

#### Success Response (`204 No Content`)
*No response body.*

---

### 4. Redirect to Destination URL

- **URL**: `/:code`
- **Method**: `GET`

#### Behavior:
- **Valid Link**: Returns `302 Found` with `Location` header set to `original_url` and atomically increments click count.
- **Expired Link**: Returns `410 Gone`.
- **Not Found**: Returns `404 Not Found`.

---

### 5. Health Check

- **URL**: `/health`
- **Method**: `GET`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

---

## cURL Examples

#### Create Short URL
```bash
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -d '{ "original_url": "https://example.com/very/long/path" }'
```

#### Create with Custom Alias & Expiration
```bash
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -d '{
    "original_url": "https://news.ycombinator.com",
    "custom_alias": "hackernews",
    "expires_at": "2026-12-31T23:59:59.000Z"
  }'
```

#### Inspect Stats
```bash
curl http://localhost:3000/api/urls/hackernews
```

#### Perform Redirect
```bash
curl -i http://localhost:3000/hackernews
```

#### Delete Short URL
```bash
curl -i -X DELETE http://localhost:3000/api/urls/hackernews
```

---

## Error Codes

| HTTP Status | Error Code | Description |
|---|---|---|
| `400 Bad Request` | `VALIDATION_ERROR` | Missing or invalid payload parameter |
| `400 Bad Request` | `INVALID_URL` | Destination URL is malformed or uses disallowed protocol |
| `400 Bad Request` | `INVALID_ALIAS` | Alias length (<3 or >32), invalid characters, or reserved word |
| `404 Not Found` | `URL_NOT_FOUND` | Short code does not exist |
| `409 Conflict` | `ALIAS_ALREADY_EXISTS` | Custom alias is already in use |
| `410 Gone` | `URL_EXPIRED` | Short URL has expired |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Unhandled server exception |

---

## License

MIT
