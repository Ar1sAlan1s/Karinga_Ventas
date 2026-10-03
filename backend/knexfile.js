import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/karinga';

if (connectionString.includes('channel_binding=')) {
  connectionString = connectionString.replace(/&?channel_binding=[^&]*/g, '');
}

const isNeonOrCloud = connectionString.includes('neon.tech') || 
                      connectionString.includes('aws') || 
                      process.env.NODE_ENV === 'production' ||
                      connectionString.includes('sslmode=require');

const config = {
  client: 'pg',
  connection: {
    connectionString,
    ssl: isNeonOrCloud ? { rejectUnauthorized: false } : false
  },
  pool: {
    min: 1,
    max: 10,
    acquireTimeoutMillis: 30000
  },
  migrations: {
    directory: path.join(__dirname, 'src', 'migrations'),
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: path.join(__dirname, 'src', 'seeds')
  }
};

export default config;
