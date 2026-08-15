import 'server-only';

import { and, eq } from 'drizzle-orm';
import type { Database } from '@/lib/db/client';
import { categoryMappingDecisions } from '@/lib/db/schema';
import { categoryMappingScope, type AuditAction } from '@/lib/audit/actions';
import { recordAuditEvent } from '@/lib/audit/record';
import { findSals3CategoryV1ByCode } from './taxonomy';
import type { RecordCategoryMappingDecisionFormInput } from './schemas';

export type RecordCategoryMappingDecisionInput =
  RecordCategoryMappingDecisionFormInput & {
    decidedBy: { employeeId: string; label: string };
  };

export type RecordCategoryMappingDecisionResult =
  | { ok: true; decisionId: string }
  | { ok: false; reason: 'UNKNOWN_SALS3_CATEGORY'; detail: string };

/**
 * Records a curated CJ-category-to-Sals3-v1-category decision, superseding
 * whatever was previously `ACTIVE` for the same `(provider,
 * external_category_id)` rather than overwriting it (ADR-014: history is
 * versioned, never rewritten).
 *
 * This only reclassifies rows in *this* application's own database - it does
 * not itself touch `sals3-portal`'s `provider_category_mappings` or
 * `products.category_id`. That publish step does not exist yet; recording a
 * decision here is real and durable, but inert until it does.
 *
 * The state change and its audit event commit together or not at all: a
 * decision this trail cannot account for is worse than one that never
 * happened, because it would leave the system doing consequential work with
 * no memory of it.
 */
export async function recordCategoryMappingDecision(
  db: Database,
  input: RecordCategoryMappingDecisionInput,
): Promise<RecordCategoryMappingDecisionResult> {
  const category = findSals3CategoryV1ByCode(input.sals3CategoryCode);

  if (category === undefined) {
    return {
      ok: false,
      reason: 'UNKNOWN_SALS3_CATEGORY',
      detail: `"${input.sals3CategoryCode}" is not a Sals3 Taxonomy v1 category code.`,
    };
  }

  const scope = categoryMappingScope(input.provider, input.externalCategoryId);
  const actor = {
    type: 'EMPLOYEE' as const,
    employeeId: input.decidedBy.employeeId,
    label: input.decidedBy.label,
  };

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: categoryMappingDecisions.id })
      .from(categoryMappingDecisions)
      .where(
        and(
          eq(categoryMappingDecisions.provider, input.provider),
          eq(
            categoryMappingDecisions.externalCategoryId,
            input.externalCategoryId,
          ),
          eq(categoryMappingDecisions.status, 'ACTIVE'),
        ),
      )
      .limit(1);

    if (existing !== undefined) {
      await tx
        .update(categoryMappingDecisions)
        .set({ status: 'SUPERSEDED' })
        .where(eq(categoryMappingDecisions.id, existing.id));

      await recordAuditEvent(tx, {
        actor,
        action: 'CATEGORY_MAPPING_SUPERSEDED' satisfies AuditAction,
        scope,
        reason: input.reason,
        before: { decisionId: existing.id },
      });
    }

    const [inserted] = await tx
      .insert(categoryMappingDecisions)
      .values({
        provider: input.provider,
        externalCategoryId: input.externalCategoryId,
        observedCategoryName: input.observedCategoryName,
        sals3CategoryCode: category.code,
        sals3CategoryPath: category.path,
        supersedesId: existing?.id ?? null,
        decidedByEmployeeId: input.decidedBy.employeeId,
        reason: input.reason,
      })
      .returning({ id: categoryMappingDecisions.id });

    if (inserted === undefined) {
      throw new Error('Category mapping decision insert returned no row.');
    }

    await recordAuditEvent(tx, {
      actor,
      action: 'CATEGORY_MAPPING_DECIDED' satisfies AuditAction,
      scope,
      reason: input.reason,
      after: {
        decisionId: inserted.id,
        sals3CategoryCode: category.code,
        sals3CategoryPath: category.path,
      },
    });

    return { ok: true, decisionId: inserted.id };
  });
}
