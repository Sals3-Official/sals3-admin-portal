import { expect, test, type Page } from '@playwright/test';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../src/lib/auth/password';
import getDb from '../src/lib/db/client';
import { auditEvents, employees } from '../src/lib/db/schema';

// Playwright's own Node process runs this file directly - unlike the Next.js
// webServer it spawns, it does not load .env.local on its own.
try {
  process.loadEnvFile('.env.local');
} catch {
  // No .env.local - DATABASE_URL must already be exported in the shell.
}

const EMAIL = 'e2e-audit@sals3.com';
const PASSWORD = 'correct horse battery staple';

test.beforeAll(async () => {
  const db = getDb();
  const passwordHash = await hashPassword(PASSWORD);
  await db
    .insert(employees)
    .values({ email: EMAIL, passwordHash })
    .onConflictDoUpdate({ target: employees.email, set: { passwordHash } });
});

/**
 * No teardown, deliberately.
 *
 * Once an employee has an audit event, that employee row cannot be deleted:
 * `actor_employee_id` is `ON DELETE RESTRICT`, and the obvious escape -
 * nulling the link first - is an `UPDATE` on `audit_events`, which the
 * append-only trigger also refuses.
 *
 * That is the design working, not an oversight. A trail you can detach from
 * the person who acted is a trail you can launder. The seed above is
 * idempotent, so re-running this suite reuses the row rather than
 * accumulating.
 *
 * The operational consequence is real and belongs in the follow-ups:
 * employees who have acted can never be removed, only deactivated - and
 * deactivation does not exist yet.
 */

async function signIn(page: Page) {
  await page.goto('/');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');
}

/**
 * Asserts a statement was refused by the append-only trigger.
 *
 * Walks the `cause` chain rather than checking `error.message`: Drizzle wraps
 * some driver errors in its own `Failed query: ...` error and passes others
 * through, so matching only the top-level message passes or fails depending
 * on which path the driver took - which would make this test report on
 * Drizzle's error handling instead of on the database guarantee.
 */
async function expectAppendOnlyRefusal(operation: Promise<unknown>) {
  let thrown: unknown;

  try {
    await operation;
  } catch (error) {
    thrown = error;
  }

  expect(thrown, 'statement was accepted, but must be refused').toBeDefined();

  const messages: string[] = [];
  for (
    let current = thrown;
    current instanceof Error;
    current = current.cause
  ) {
    messages.push(current.message);
  }

  expect(messages.join(' | ')).toMatch(/append-only/i);
}

/**
 * The claim the whole table rests on. If these three statements succeed, the
 * trail is a log with extra steps: anything that can write can also quietly
 * rewrite, and "immutable" in the docs is decoration.
 *
 * Asserted against the real database rather than a mock, because the
 * guarantee lives in a Postgres trigger, not in application code - a mock
 * would only prove the test author's assumption.
 */
test('audit_events rejects UPDATE, DELETE, and TRUNCATE at the database', async () => {
  const db = getDb();

  await db.insert(auditEvents).values({
    correlationId: randomUUID(),
    actorType: 'CLI',
    actorLabel: 'e2e:append-only-probe',
    action: 'EMPLOYEE_PROVISIONED',
    scope: 'global',
    reason: 'Probe row proving the append-only trigger is live.',
  });

  await expectAppendOnlyRefusal(
    db.execute(
      sql`UPDATE audit_events SET reason = 'tampered' WHERE actor_label = 'e2e:append-only-probe'`,
    ),
  );

  await expectAppendOnlyRefusal(
    db.execute(
      sql`DELETE FROM audit_events WHERE actor_label = 'e2e:append-only-probe'`,
    ),
  );

  await expectAppendOnlyRefusal(db.execute(sql`TRUNCATE audit_events`));

  // Still there, unaltered, after three attempts to change it.
  const [row] = await db
    .select({ reason: auditEvents.reason })
    .from(auditEvents)
    .where(eq(auditEvents.actorLabel, 'e2e:append-only-probe'))
    .limit(1);

  expect(row?.reason).toBe(
    'Probe row proving the append-only trigger is live.',
  );
});

test('signing in appends an attributable event the trail page shows', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/policy/audit');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Audit trail' }),
  ).toBeVisible();

  const row = page.getByRole('row').filter({ hasText: EMAIL }).first();
  await expect(row).toBeVisible();
  await expect(row).toContainText('Employee signed in');
  await expect(row).toContainText('UTC');
});

test('a rejected credential is recorded without claiming an identity', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Email').fill('nobody-at-all@sals3.com');
  await page.getByLabel('Password', { exact: true }).fill('wrong password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(
    page.getByText('We could not sign you in with those credentials.'),
  ).toBeVisible();

  await signIn(page);
  await page.goto('/policy/audit');

  const row = page
    .getByRole('row')
    .filter({ hasText: 'nobody-at-all@sals3.com' })
    .first();

  await expect(row).toContainText('Sign-in failed');
  // Attributed to nobody, because the request proved nobody.
  await expect(row).toContainText('Unauthenticated');
});

test('the trail is reachable from the rail and denies by default', async ({
  page,
}) => {
  await signIn(page);

  await page
    .getByRole('navigation', { name: 'Admin sections' })
    .getByRole('link', { name: 'Audit trail' })
    .click();
  await expect(page).toHaveURL('/policy/audit');

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/policy/audit');
  await expect(page).toHaveURL('/');
});
