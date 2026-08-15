import { AppError } from '../utils/errors.js';

/**
 * Global centralized error handling middleware.
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let errorCode = err.code || (statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR');
  let errorMessage = err.message || 'An unexpected error occurred';

  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    errorMessage = 'Malformed JSON in request body';
  }

  // Log server errors (status 500) without exposing sensitive internal details
  if (statusCode >= 500) {
    console.error('[ERROR]', err);
  }

  // Handle HTML response for direct browser navigation to redirect routes
  const isHtmlRequest = req.accepts('html', 'json') === 'html';
  const isApiRoute = req.originalUrl.startsWith('/api');

  if (isHtmlRequest && !isApiRoute) {
    return res.status(statusCode).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${statusCode} - ${errorMessage}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 1.5rem;
            box-sizing: border-box;
          }
          .card {
            background: #1e293b;
            border: 1px solid #334155;
            padding: 2.5rem;
            border-radius: 1rem;
            text-align: center;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          }
          h1 {
            font-size: 3.5rem;
            margin: 0 0 0.5rem 0;
            color: #ef4444;
          }
          p {
            color: #94a3b8;
            font-size: 1.1rem;
            line-height: 1.6;
            margin: 0 0 2rem 0;
          }
          a {
            display: inline-block;
            background: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            transition: background 0.2s;
          }
          a:hover {
            background: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${statusCode}</h1>
          <p>${errorMessage}</p>
          <a href="/">Return to Home</a>
        </div>
      </body>
      </html>
    `);
  }

  // Consistent API JSON Response
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
    },
  });
}
