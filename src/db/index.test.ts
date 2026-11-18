import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPostgresPoolConfig } from './index.ts';

test('buildPostgresPoolConfig uses DATABASE_URL with ssl rejectUnauthorized=false in production/Vercel', () => {
  const prodConfig = buildPostgresPoolConfig({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://user:pass@ep-cool-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  });

  assert.equal(
    prodConfig.connectionString,
    'postgresql://user:pass@ep-cool-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
  );
  assert.deepEqual(prodConfig.ssl, { rejectUnauthorized: false });

  const vercelConfig = buildPostgresPoolConfig({
    VERCEL: '1',
    DATABASE_URL: 'postgresql://postgres:pw@db.example.supabase.co:5432/postgres',
  });
  assert.deepEqual(vercelConfig.ssl, { rejectUnauthorized: false });
});

test('buildPostgresPoolConfig preserves Cloud SQL SQL_HOST/SQL_USER/SQL_PASSWORD/SQL_DB_NAME when DATABASE_URL is absent', () => {
  const localConfig = buildPostgresPoolConfig({
    SQL_HOST: '127.0.0.1',
    SQL_USER: 'appuser',
    SQL_PASSWORD: 'secret',
    SQL_DB_NAME: 'dream_university',
  });

  assert.equal(localConfig.host, '127.0.0.1');
  assert.equal(localConfig.user, 'appuser');
  assert.equal(localConfig.database, 'dream_university');
  assert.equal(localConfig.connectionString, undefined);
});
