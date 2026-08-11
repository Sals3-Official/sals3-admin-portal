import { expect, test } from '@playwright/test';

test('bootstrap page identifies the Admin Portal and claims nothing', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Platform control plane' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Market governance' }),
  ).toBeVisible();
  await expect(page.getByText('No authoritative data source')).toBeVisible();
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
