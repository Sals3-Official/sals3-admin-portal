import 'server-only';

import taxonomyRows from './sals3-taxonomy-v1.json';

/**
 * Sals3 Taxonomy v1 - the Google Product Taxonomy, verbatim (5,595 rows, 21
 * L1 departments). This is a frozen copy of `sals3-portal`'s own
 * `src/lib/db/seed-data/sals3-taxonomy-v1.json`: real, already-approved
 * reference data, not generated or guessed. It is duplicated here rather
 * than fetched at request time because Gate 0 forbids this application from
 * reading `sals3-portal`'s database directly, and no publish/consume channel
 * exists yet for taxonomy reference data specifically (AGENTS.md rule 4).
 *
 * A category decision recorded here is checked against this same frozen
 * copy, so "does this code exist" can never disagree between the two apps
 * for a code recorded today - it would only drift if `sals3-portal` later
 * adopts a v2 and this copy is not updated alongside it.
 */
export type Sals3CategoryV1 = {
  code: string;
  l1: string;
  l2: string | null;
  l3: string | null;
  l4: string | null;
  l5: string | null;
  path: string;
};

const TAXONOMY_V1: Sals3CategoryV1[] = taxonomyRows as Sals3CategoryV1[];

const BY_CODE = new Map<string, Sals3CategoryV1>(
  TAXONOMY_V1.map((row) => [row.code, row]),
);

/**
 * The only path a decision may be recorded through: a payload that names a
 * category must have that category actually exist in the tree, or the write
 * refuses rather than trusting a client-supplied path string. Mirrors
 * `sals3-portal`'s own `findCategoryByCode` reasoning for the same taxonomy.
 */
export function findSals3CategoryV1ByCode(
  code: string,
): Sals3CategoryV1 | undefined {
  return BY_CODE.get(code);
}

/** `{ code, path }` pairs for the picker - smaller than the full row shape. */
export function listSals3CategoryV1Options(): {
  code: string;
  path: string;
}[] {
  return TAXONOMY_V1.map((row) => ({ code: row.code, path: row.path }));
}
