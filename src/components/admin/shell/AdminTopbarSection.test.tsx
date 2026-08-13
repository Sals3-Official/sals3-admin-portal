import { describe, expect, it } from 'vitest';
import { sectionLabelFor } from './AdminTopbarSection';

describe('sectionLabelFor', () => {
  it.each([
    ['/dashboard', 'Overview'],
    ['/market-governance/seller-countries', 'Market governance'],
    ['/market-governance/buyer-countries', 'Market governance'],
    ['/seller-accounts', 'Seller accounts'],
    ['/marketing', 'Marketing'],
    ['/providers', 'Providers'],
    ['/policy/publications', 'Policy'],
    ['/policy/audit', 'Policy'],
    ['/pricing', 'Pricing'],
  ])('names %s as %s', (pathname, expected) => {
    expect(sectionLabelFor(pathname)).toBe(expected);
  });

  it('falls back to the product name for an unknown route', () => {
    expect(sectionLabelFor('/nowhere')).toBe('Admin Portal');
  });
});
