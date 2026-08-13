import { describe, expect, it } from 'vitest';
import { NAV_GROUPS, NAV_ITEMS } from './navigation';

describe('admin navigation', () => {
  it('covers the six ADR-014 capability domains plus an overview', () => {
    expect(NAV_GROUPS.map((group) => group.label)).toEqual([
      'Overview',
      'Market governance',
      'Seller accounts',
      'Marketing',
      'Providers',
      'Policy',
      'Pricing',
    ]);
  });

  it('keeps seller-operating and buyer-destination country policy as two separate destinations', () => {
    // ADR-014: the two are independently versioned and must never collapse
    // into one ambiguous market code. One combined nav entry would be the
    // first step toward exactly that.
    const market = NAV_GROUPS.find(
      (group) => group.label === 'Market governance',
    );

    expect(market?.items.map((item) => item.href)).toEqual([
      '/market-governance/seller-countries',
      '/market-governance/buyer-countries',
    ]);
  });

  it('has a unique href per destination', () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('points every destination at an absolute in-app route', () => {
    NAV_ITEMS.forEach((item) => {
      expect(item.href.startsWith('/')).toBe(true);
    });
  });

  /**
   * The regression this guards: sals3-portal's rail carries counts, and a
   * later edit that ports one over would be showing a number no service in
   * this repository can produce. A missing figure is never a zero.
   */
  it('carries no badge, count, or numeric field anywhere', () => {
    const serialised = JSON.stringify(NAV_GROUPS);

    expect(serialised).not.toMatch(/"badge"/);
    expect(serialised).not.toMatch(/"count"/);

    // No rendered label may carry a numeral. Descriptions are exempt because
    // they cite ADR numbers, which are document references rather than
    // figures about the platform.
    [
      ...NAV_GROUPS.map((group) => group.label),
      ...NAV_ITEMS.map((item) => item.label),
    ].forEach((label) => {
      expect(label).not.toMatch(/\d/);
    });
  });

  it('marks a group solo only when it has exactly one item', () => {
    NAV_GROUPS.filter((group) => group.solo === true).forEach((group) => {
      expect(group.items).toHaveLength(1);
    });
  });
});
