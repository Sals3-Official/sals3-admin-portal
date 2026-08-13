import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Drizzle client over `postgres.js`.
 *
 * Server-only: the guard below turns an accidental client import into an
 * immediate, obvious failure instead of a silent bundle leak.
 *
 * The connection is created lazily, on first query - never at module
 * evaluation, so `next build` still succeeds in an environment with no
 * `DATABASE_URL` (CI, a fresh clone). The client is cached on `globalThis` so
 * development hot-reload reuses one bounded pool instead of opening a new one
 * on every edit.
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'src/lib/db/client.ts is server-only and must not be imported by client code.',
  );
}

const POOL_MAX = 10;
const IDLE_TIMEOUT_SECONDS = 20;
const CONNECT_TIMEOUT_SECONDS = 10;

export type Database = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  sals3AdminSql?: ReturnType<typeof postgres>;
  sals3AdminDb?: Database;
};

/**
 * Whether a connection string is present. Callers that render a page should
 * check this and degrade honestly rather than letting a query throw a 500.
 */
export function isDatabaseConfigured(): boolean {
  const connectionString = process.env.DATABASE_URL;
  return connectionString !== undefined && connectionString !== '';
}

function requiresTls(connectionString: string): boolean {
  try {
    const { hostname } = new URL(connectionString);
    return hostname !== 'localhost' && hostname !== '127.0.0.1';
  } catch {
    // An unparseable URL is a configuration error; fail closed on TLS.
    return true;
  }
}

function createSql(): ReturnType<typeof postgres> {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString === undefined || connectionString === '') {
    throw new Error('DATABASE_URL is not set.');
  }

  return postgres(connectionString, {
    max: POOL_MAX,
    idle_timeout: IDLE_TIMEOUT_SECONDS,
    connect_timeout: CONNECT_TIMEOUT_SECONDS,
    // Any non-local host must present a valid certificate.
    ssl: requiresTls(connectionString) ? 'verify-full' : false,
    onnotice: () => {},
  });
}

/**
 * Returns the Drizzle client, connecting on first use. Throws only when a
 * query is actually attempted without `DATABASE_URL`.
 */
export default function getDb(): Database {
  if (globalForDb.sals3AdminDb !== undefined) {
    return globalForDb.sals3AdminDb;
  }

  const sql = createSql();
  const db = drizzle(sql, { schema });

  globalForDb.sals3AdminSql = sql;
  globalForDb.sals3AdminDb = db;

  return db;
}
