import { expect, test } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../src/lib/auth/password';
import getDb from '../src/lib/db/client';
import { employees } from '../src/lib/db/schema';

// Playwright's own Node process runs this file directly - unlike the Next.js
// webServer it spawns, it does not load .env.local on its own.
try {
  process.loadEnvFile('.env.local');
} catch {
  // No .env.local - DATABASE_URL must already be exported in the shell.
}

test('bootstrap page presents employee sign-in and claims nothing else', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Employee sign-in' }),
  ).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
});

test('rejects an unknown credential with one generic message', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByLabel('Email').fill('nobody@sals3.com');
  await page.getByLabel('Password', { exact: true }).fill('whatever');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(
    page.getByText('We could not sign you in with those credentials.'),
  ).toBeVisible();
  await expect(page).toHaveURL('/');
});

/**
 * Scoped to its own describe block, with the seeded row created and torn
 * down only around this one test - fullyParallel runs every top-level test
 * in this file in its own worker, and a file-level beforeAll/afterAll would
 * run in every one of them. Sharing one row across workers let one worker's
 * teardown delete the row while another worker's sign-in was still using it.
 */
test.describe('real employee sign-in', () => {
  const email = 'e2e-employee@sals3.com';
  const password = 'correct horse battery staple';

  test.beforeAll(async () => {
    const db = getDb();
    const passwordHash = await hashPassword(password);
    await db
      .insert(employees)
      .values({ email, passwordHash })
      .onConflictDoUpdate({ target: employees.email, set: { passwordHash } });
  });

  test.afterAll(async () => {
    const db = getDb();
    await db.delete(employees).where(eq(employees.email, email));
  });

  test('reaches the deny-by-default dashboard and signs out', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Overview' }),
    ).toBeVisible();
    await expect(
      page.getByText(`Signed in as ${email}`, { exact: false }),
    ).toBeVisible();

    // Visiting the sign-in gate again while signed in redirects straight back.
    await page.goto('/');
    await expect(page).toHaveURL('/dashboard');

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/');

    // The dashboard denies by default once the session is gone.
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/');
  });
});

test('every response carries the internal-only security headers', async ({
  page,
}) => {
  const response = await page.goto('/');

  expect(response).not.toBeNull();

  const headers = response!.headers();

  // Asserted end-to-end rather than by reading next.config.ts: a header that
  // is configured but not actually sent is the failure mode worth catching.
  expect(headers['x-robots-tag']).toContain('noindex');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
});
