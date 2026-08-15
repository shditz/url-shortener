# Contributing to URL Shortener

Thank you for your interest in contributing to the URL Shortener project! We welcome contributions, bug fixes, and feature suggestions.

## Code of Conduct

Please be respectful, constructive, and inclusive in all communications and reviews.

## Development Setup

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/<your-username>/url-shortener.git
   cd url-shortener
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Development Guidelines

- **Architecture**:
  - Keep business logic in `src/services/`.
  - Keep SQL queries parameterized and confined to `src/repositories/`.
  - Keep controllers thin and responsible only for HTTP request/response handling.
- **Frontend**:
  - Use Vanilla HTML, CSS, and JavaScript. Do not introduce frontend frameworks or bundlers.
- **Database**:
  - Always use parameterized queries with `better-sqlite3`. Never concatenate user input into SQL queries.

## Running Tests

All changes must pass existing tests and include new test cases for added features:

```bash
npm test
```

## Pull Request Process

1. Create a feature branch with a descriptive name:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Follow **Conventional Commits** for your commit messages (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
3. Ensure all tests pass locally (`npm test`).
4. Push your branch and open a Pull Request against the `main` branch with a clear description of the changes.
