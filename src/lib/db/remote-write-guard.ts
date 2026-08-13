/**
 * Refuses a destructive database command when `DATABASE_URL` points somewhere
 * other than this machine.
 *
 * Every write command in this repository reads exactly one file -
 * `process.loadEnvFile('.env.local')` - and `drizzle.config.ts` does the
 * same. So the moment a non-local connection string ends up in `.env.local`,
 * every script silently repoints there: `db:migrate` alters the live schema
 * and `create-employee` provisions a real account with real access to the
 * platform control plane. Neither asks, and `db:migrate` succeeds quietly
 * when there is nothing new to apply - so the mistake can go unnoticed until
 * it doesn't.
 *
 * This module is pure so it can be tested without a database. See
 * `scripts/guard-remote-db.mts` for the thin CLI around it.
 */

/** Hosts that are unambiguously this machine. Anything else is treated as remote. */
const LOCAL_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '[::1]',
  '0.0.0.0',
]);

/** Set this to `1` to consciously allow a remote write. Nothing sets it by default. */
export const ALLOW_REMOTE_ENV_VAR = 'ALLOW_REMOTE_DB_WRITE';

export type DatabaseTarget =
  | { kind: 'LOCAL'; host: string; database: string }
  | { kind: 'REMOTE'; host: string; database: string }
  | { kind: 'MISSING' }
  | { kind: 'UNPARSEABLE'; raw: string };

/**
 * Classifies a connection string without connecting to it.
 *
 * An unparseable URL is its own outcome rather than being folded into
 * `REMOTE`: the caller should say "this is malformed" instead of "this looks
 * like production", because the two need different fixes. It still blocks -
 * failing closed on a string we cannot read is the only safe reading.
 */
export function classifyDatabaseTarget(
  connectionString: string | undefined,
): DatabaseTarget {
  if (connectionString === undefined || connectionString.trim() === '') {
    return { kind: 'MISSING' };
  }

  let parsed: URL;

  try {
    parsed = new URL(connectionString);
  } catch {
    return { kind: 'UNPARSEABLE', raw: connectionString };
  }

  const host = parsed.hostname;
  const database = parsed.pathname.replace(/^\//, '');

  return {
    kind: LOCAL_HOSTNAMES.has(host) ? 'LOCAL' : 'REMOTE',
    host,
    database,
  };
}

export type GuardDecision =
  | {
      allowed: true;
      reason: 'LOCAL' | 'REMOTE_EXPLICITLY_ALLOWED';
      message: string;
    }
  | {
      allowed: false;
      reason: 'MISSING' | 'UNPARSEABLE' | 'REMOTE';
      message: string;
    };

export type GuardInput = {
  /** The command being guarded, quoted back to the operator so the refusal is specific. */
  command: string;
  connectionString: string | undefined;
  /** Raw value of `ALLOW_REMOTE_DB_WRITE`; only the exact string `'1'` opts in. */
  allowRemote: string | undefined;
};

/**
 * Decides whether a write command may run.
 *
 * Never echoes the connection string - a refusal prints the host and
 * database name only. The password lives in that string, and a guard that
 * leaks the credential it is protecting into a terminal or CI log would be
 * worse than no guard.
 */
export function decideRemoteWrite(input: GuardInput): GuardDecision {
  const target = classifyDatabaseTarget(input.connectionString);

  if (target.kind === 'MISSING') {
    return {
      allowed: false,
      reason: 'MISSING',
      message: `${input.command}: DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.`,
    };
  }

  if (target.kind === 'UNPARSEABLE') {
    return {
      allowed: false,
      reason: 'UNPARSEABLE',
      message: `${input.command}: DATABASE_URL could not be parsed as a URL, so this command cannot tell a local database from production. Refusing rather than guessing.`,
    };
  }

  if (target.kind === 'LOCAL') {
    return {
      allowed: true,
      reason: 'LOCAL',
      message: `${input.command}: target is local (${target.host}/${target.database}).`,
    };
  }

  if (input.allowRemote === '1') {
    return {
      allowed: true,
      reason: 'REMOTE_EXPLICITLY_ALLOWED',
      message: `${input.command}: REMOTE target ${target.host}/${target.database} allowed by ${ALLOW_REMOTE_ENV_VAR}=1.`,
    };
  }

  return {
    allowed: false,
    reason: 'REMOTE',
    message: [
      `${input.command}: refusing to run against a REMOTE database.`,
      '',
      `  host      ${target.host}`,
      `  database  ${target.database}`,
      '',
      'DATABASE_URL in .env.local does not point at this machine. If that is a',
      'production connection string, this command would have altered production.',
      '',
      `If you genuinely mean to write to that database, re-run with ${ALLOW_REMOTE_ENV_VAR}=1.`,
    ].join('\n'),
  };
}
