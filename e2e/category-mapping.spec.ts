import { expect, test, type Page } from '@playwright/test';
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

const EMAIL = 'e2e-category-mapping@sals3.com';
const PASSWORD = 'correct horse battery staple';

test.beforeAll(async () => {
  const db = getDb();
  const passwordHash = await hashPassword(PASSWORD);
  await db
    .insert(employees)
    .values({ email: EMAIL, passwordHash })
    .onConflictDoUpdate({ target: employees.email, set: { passwordHash } });
});

async function signIn(page: Page) {
  await page.goto('/');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');
}

test('reachable from the rail, states its two honest gaps, and denies by default', async ({
  page,
}) => {
  await signIn(page);

  await page
    .getByRole('navigation', { name: 'Admin sections' })
    .getByRole('link', { name: 'Category mapping' })
    .click();
  await expect(page).toHaveURL('/catalog/category-mapping');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Category mapping' }),
  ).toBeVisible();

  // The two things this screen is honest about not having yet.
  await expect(page.getByText('Categories awaiting review')).toBeVisible();
  await expect(
    page.getByText('Publishing a decision to sals3-portal'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/catalog/category-mapping');
  await expect(page).toHaveURL('/');
});

test('records a decision, appends an audited row, and shows it in the recent-decisions table', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/catalog/category-mapping');

  const externalCategoryId = `e2e-cat-${Date.now()}`;

  await page.getByLabel('CJ external category ID').fill(externalCategoryId);
  await page
    .getByLabel('Observed CJ category name')
    .fill('E2E Test Supplier Category');
  await page
    .getByPlaceholder('Search the Sals3 v1 taxonomy, e.g. Jackets')
    .fill('Live Animals');
  // A button, not `getByText`: no teardown between runs means the recent-
  // decisions table can already hold a row with this same category path,
  // and `getByText` would then match both the picker's option and the table
  // cell. Only the picker's option has button role.
  await page
    .getByRole('button', { name: 'Animals & Pet Supplies > Live Animals' })
    .click();
  await page.getByLabel('Reason').fill('E2E coverage for Stage 1.');
  await page.getByRole('button', { name: 'Record decision' }).click();

  await expect(page.getByText('Decision recorded.')).toBeVisible();

  const row = page.getByRole('row').filter({ hasText: externalCategoryId });
  await expect(row).toBeVisible();
  await expect(row).toContainText('Animals & Pet Supplies > Live Animals');
  await expect(row).toContainText('Active');

  await page.goto('/policy/audit');
  const auditRow = page
    .getByRole('row')
    .filter({ hasText: 'Category mapping decided' })
    .first();
  await expect(auditRow).toBeVisible();
});
