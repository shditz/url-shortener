import { app } from './app.js';
import { config } from './config/env.js';
import { initDatabase } from './db/database.js';

try {
  // Initialize Database
  initDatabase(config.databasePath);
  console.log(`Database connected at ${config.databasePath}`);

  // Start HTTP Server
  const server = app.listen(config.port, () => {
    console.log(`Server running on ${config.baseUrl} (port ${config.port})`);
    console.log(`Health check: ${config.baseUrl}/health`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
} catch (error) {
  console.error('[ERROR] Failed to start server:', error.message);
  process.exit(1);
}
