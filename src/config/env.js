import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file if available
dotenv.config();

const port = parseInt(process.env.PORT || '3000', 10);
const baseUrl = (process.env.BASE_URL || `http://localhost:${port}`).replace(/\/+$/, '');
const databasePath = process.env.DATABASE_PATH || './data/database.sqlite';
const nodeEnv = process.env.NODE_ENV || 'development';

export const config = {
  port,
  baseUrl,
  databasePath,
  nodeEnv,
};
