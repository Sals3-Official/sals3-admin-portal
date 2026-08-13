/* eslint-disable no-console -- this is a CLI script; status output is its job. */
/**
 * Provisions one employee account. There is no public signup route for
 * Admin Portal - a capability this powerful must never expose open
 * registration (AGENTS.md rule 1). This script, guarded by
 * `scripts/guard-remote-db.mts`, is the only way an employee row is created.
 *
 *   npm run create-employee -- <email> <password>
 */
/* eslint-disable import/extensions -- extensionless matches this codebase's
   scripts/ convention. */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hashPassword } from '../src/lib/auth/password';
import { employees } from '../src/lib/db/schema';

try {
  process.loadEnvFile('.env.local');
} catch {
  // No .env.local - env vars must already be exported in the shell.
}

const [, , email, password] = process.argv;

if (email === undefined || password === undefined) {
  console.error('Usage: npm run create-employee -- <email> <password>');
  process.exit(1);
}

const MIN_PASSWORD_LENGTH = 12;

if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;

if (connectionString === undefined || connectionString === '') {
  console.error(
    'DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.',
  );
  process.exit(1);
}

// A one-off connection, deliberately not src/lib/db/client.ts's getDb():
// importing that module's default export from this ESM script hits a
// tsx/Node ESM<->CJS interop gap (a bare default import of a CJS module with
// no __esModule marker resolves to the whole module namespace object, not
// the unwrapped function) - see sals3-portal's own create-portal-user.mts,
// which opens its own connection for the same reason.
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql, { schema: { employees } });

const passwordHash = await hashPassword(password);

await db.insert(employees).values({ email: email.toLowerCase(), passwordHash });

console.log(`Created employee ${email.toLowerCase()}.`);
await sql.end();
process.exit(0);
