import 'server-only';

import { and, desc, eq } from 'drizzle-orm';
import getDb, { isDatabaseConfigured } from '@/lib/db/client';
import { categoryMappingDecisions } from '@/lib/db/schema';

export type CategoryMappingDecisionRow = {
  id: string;
  provider: string;
  externalCategoryId: string;
  observedCategoryName: string;
  sals3CategoryCode: string;
  sals3CategoryPath: string;
  status: 'ACTIVE' | 'SUPERSEDED';
  decidedAt: Date;
  reason: string;
};

/**
 * `UNAVAILABLE` is distinct from an empty list, matching
 * `listRecentAuditEvents`: "no database configured" and "nothing decided
 * yet" are different facts.
 */
export type CategoryMappingDecisionsResult =
  | { status: 'OK'; decisions: CategoryMappingDecisionRow[] }
  | { status: 'UNAVAILABLE' };

const RECENT_DECISIONS_LIMIT = 100;

/** Every decision this application has ever recorded, newest first. */
export async function listCategoryMappingDecisions(): Promise<CategoryMappingDecisionsResult> {
  if (!isDatabaseConfigured()) {
    return { status: 'UNAVAILABLE' };
  }

  const rows = await getDb()
    .select()
    .from(categoryMappingDecisions)
    .orderBy(desc(categoryMappingDecisions.decidedAt))
    .limit(RECENT_DECISIONS_LIMIT);

  return { status: 'OK', decisions: rows };
}

/** The currently `ACTIVE` decision for one supplier category, if any. */
export async function findActiveCategoryMappingDecision(
  provider: 'CJ_DROPSHIPPING',
  externalCategoryId: string,
): Promise<CategoryMappingDecisionRow | null> {
  const [row] = await getDb()
    .select()
    .from(categoryMappingDecisions)
    .where(
      and(
        eq(categoryMappingDecisions.provider, provider),
        eq(categoryMappingDecisions.externalCategoryId, externalCategoryId),
        eq(categoryMappingDecisions.status, 'ACTIVE'),
      ),
    )
    .limit(1);

  return row ?? null;
}
