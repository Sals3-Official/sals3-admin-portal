'use server';

import { revalidatePath } from 'next/cache';
import getDb, { isDatabaseConfigured } from '@/lib/db/client';
import { getSessionEmployee } from '@/lib/auth/session';
import { recordCategoryMappingDecisionSchema } from '@/lib/catalog-governance/schemas';
import { recordCategoryMappingDecision } from '@/lib/catalog-governance/record-decision';

export type RecordCategoryMappingDecisionActionResult =
  { ok: true } | { ok: false; error: string };

/**
 * Records one CJ-category-to-Sals3-v1 decision from the category-mapping
 * screen.
 *
 * Deny-by-default: every field is re-validated server-side regardless of
 * what the client claims, and there is no capability beyond reaching this
 * action to check yet - `getSessionEmployee()` is the one real gate this
 * application has today (no permission/role model exists yet, matching every
 * other protected page in this repo). `recordCategoryMappingDecision` itself
 * re-derives the Sals3 category path from the code rather than trusting
 * anything the form sent, so a crafted payload cannot record a fabricated
 * path alongside a real code.
 */
export async function recordCategoryMappingDecisionAction(
  input: unknown,
): Promise<RecordCategoryMappingDecisionActionResult> {
  const employee = await getSessionEmployee();

  if (employee === null) {
    return { ok: false, error: 'Sign in required.' };
  }

  const parsed = recordCategoryMappingDecisionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: 'One or more fields are missing or invalid.' };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      error: 'No database is configured for this deployment.',
    };
  }

  const result = await recordCategoryMappingDecision(getDb(), {
    ...parsed.data,
    decidedBy: { employeeId: employee.id, label: employee.email },
  });

  if (!result.ok) {
    return { ok: false, error: result.detail };
  }

  revalidatePath('/catalog/category-mapping');

  return { ok: true };
}
