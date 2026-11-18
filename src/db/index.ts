import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export function buildPostgresPoolConfig(env: NodeJS.ProcessEnv = process.env): PoolConfig {
  const connectionString = env.DATABASE_URL?.trim();
  const isProduction = env.NODE_ENV === 'production' || Boolean(env.VERCEL);

  if (connectionString) {
    const isLocalHost = /localhost|127\.0\.0\.1/i.test(connectionString);
    return {
      connectionString,
      ssl: isProduction || !isLocalHost ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 15000,
    };
  }

  return {
    host: env.SQL_HOST,
    user: env.SQL_USER,
    password: env.SQL_PASSWORD,
    database: env.SQL_DB_NAME,
    max: 10,
    connectionTimeoutMillis: 15000,
  };
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool(buildPostgresPoolConfig());

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
