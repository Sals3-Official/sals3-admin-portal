import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

/* eslint-disable import/first */
import {
  findSals3CategoryV1ByCode,
  listSals3CategoryV1Options,
} from './taxonomy';
/* eslint-enable import/first */

describe('findSals3CategoryV1ByCode', () => {
  it('resolves a real Sals3 Taxonomy v1 code', () => {
    expect(findSals3CategoryV1ByCode('CAT-GGL-1')).toMatchObject({
      code: 'CAT-GGL-1',
      l1: 'Animals & Pet Supplies',
      path: 'Animals & Pet Supplies',
    });
  });

  it('returns undefined for a code that is not in the tree', () => {
    expect(findSals3CategoryV1ByCode('NOT-A-REAL-CODE')).toBeUndefined();
  });
});

describe('listSals3CategoryV1Options', () => {
  it('lists all 5,595 v1 categories as code/path pairs', () => {
    const options = listSals3CategoryV1Options();

    expect(options).toHaveLength(5595);
    expect(options[0]).toEqual({
      code: 'CAT-GGL-1',
      path: 'Animals & Pet Supplies',
    });
  });

  it('has no duplicate codes', () => {
    const options = listSals3CategoryV1Options();
    const codes = new Set(options.map((option) => option.code));

    expect(codes.size).toBe(options.length);
  });
});
