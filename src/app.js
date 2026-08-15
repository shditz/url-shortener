import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api.routes.js';
import { redirectRouter } from './routes/redirect.routes.js';
import { urlController } from './controllers/url.controller.js';
import { errorHandler } from './middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '../public');

export function createApp() {
  const app = express();

  // Basic security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Limit JSON body size to prevent abuse
  app.use(express.json({ limit: '10kb' }));

  // Serve static frontend assets
  app.use(express.static(publicDir));

  // Health check endpoint
  app.get('/health', urlController.health);

  // API Endpoints
  app.use('/api', apiRouter);

  // Catch unmatched API routes before redirect handler
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `API endpoint ${req.method} ${req.originalUrl} not found`,
      },
    });
  });

  // Redirect handler (for short codes: /:code)
  app.use('/', redirectRouter);

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}

export const app = createApp();
