import { expect, test, type Page } from '@playwright/test';
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

const EMAIL = 'e2e-shell@sals3.com';
const PASSWORD = 'correct horse battery staple';

test.beforeAll(async () => {
  const db = getDb();
  const passwordHash = await hashPassword(PASSWORD);
  await db
    .insert(employees)
    .values({ email: EMAIL, passwordHash })
    .onConflictDoUpdate({ target: employees.email, set: { passwordHash } });
});

test.afterAll(async () => {
  const db = getDb();
  await db.delete(employees).where(eq(employees.email, EMAIL));
});

async function signIn(page: Page) {
  await page.goto('/');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');
}

test('shell renders the rail, the topbar identity, and a skip link', async ({
  page,
}) => {
  await signIn(page);

  await expect(
    page.getByRole('navigation', { name: 'Admin sections' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Skip to main content' }),
  ).toBeAttached();
  // Scoped to the topbar: the overview body also names the signed-in
  // employee, so an unscoped text match resolves to two elements. Located by
  // element rather than by the `banner` role, which a <header> only takes on
  // outside <main> - and the topbar sits inside SidebarInset, which is the
  // page's <main>.
  await expect(
    page.locator('header').getByText(EMAIL, { exact: true }),
  ).toBeVisible();

  // Exactly one <main> - SidebarInset is itself the page's main, so the
  // content column inside it must not be a second one.
  await expect(page.locator('main')).toHaveCount(1);
});

test('every navigation destination is reachable and states what is unavailable', async ({
  page,
}) => {
  await signIn(page);

  const destinations = [
    [
      'Seller countries',
      '/market-governance/seller-countries',
      'Seller operating countries',
    ],
    [
      'Buyer destinations',
      '/market-governance/buyer-countries',
      'Buyer destination countries',
    ],
    ['Seller accounts', '/seller-accounts', 'Seller accounts'],
    ['Campaigns', '/marketing', 'Global marketing and communications'],
    ['Supplier providers', '/providers', 'Supplier provider governance'],
    ['Publications', '/policy/publications', 'Policy publications'],
    ['Audit trail', '/policy/audit', 'Audit trail'],
    ['Platform pricing', '/pricing', 'Commercial pricing governance'],
  ] as const;

  for (const [linkName, href, heading] of destinations) {
    await page
      .getByRole('navigation', { name: 'Admin sections' })
      .getByRole('link', { name: linkName })
      .click();

    await expect(page).toHaveURL(href);
    await expect(
      page.getByRole('heading', { level: 1, name: heading }),
    ).toBeVisible();

    // Every one of these is honest about having no backing service. None may
    // render a figure.
    const status = page.locator('section p').first();
    await expect(status).toHaveText(
      /Not implemented|Not connected|No authoritative data source/,
    );
  }
});

test('collapsing the rail actually narrows it and swaps labels for hover flyouts', async ({
  page,
}) => {
  await signIn(page);

  const rail = page.locator('[data-slot="sidebar"]');
  const gap = page.locator('[data-slot="sidebar-gap"]');

  await expect(rail).toHaveAttribute('data-state', 'expanded');
  const expandedWidth = (await gap.boundingBox())?.width ?? 0;
  expect(expandedWidth).toBeGreaterThan(200);

  await page.getByRole('button', { name: 'Close sidebar' }).click();

  await expect(rail).toHaveAttribute('data-state', 'collapsed');
  // The real regression: `data-state` flipping while the CSS width does not
  // follow means the collapse is cosmetic only.
  await expect
    .poll(async () => (await gap.boundingBox())?.width ?? 0)
    .toBeLessThan(100);

  // Groups with children become hover flyout triggers rather than labelled rows.
  await expect(
    page.getByRole('button', { name: 'Market governance' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Market governance' }).hover();
  const flyout = page.getByRole('menu', { name: 'Market governance' });
  await expect(flyout).toBeVisible();
  await expect(
    flyout.getByRole('menuitem', { name: 'Seller countries' }),
  ).toBeVisible();
});

test('the whole route group denies by default once signed out', async ({
  page,
}) => {
  await signIn(page);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/');

  for (const href of ['/dashboard', '/policy/audit', '/pricing']) {
    await page.goto(href);
    await expect(page).toHaveURL('/');
  }
});
