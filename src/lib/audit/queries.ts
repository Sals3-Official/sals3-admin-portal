import 'server-only';

import { desc } from 'drizzle-orm';
import getDb, { isDatabaseConfigured } from '@/lib/db/client';
import { auditEvents } from '@/lib/db/schema';
import type { AuditAction } from './actions';

export type AuditEventRow = {
  id: string;
  occurredAt: Date;
  correlationId: string;
  actorType: 'EMPLOYEE' | 'ANONYMOUS' | 'CLI';
  actorLabel: string;
  action: string;
  scope: string;
  reason: string;
  beforeState: unknown;
  afterState: unknown;
};

/**
 * `UNAVAILABLE` is distinct from an empty list on purpose. "No database
 * configured" and "nothing has been recorded" are different facts, and a page
 * that renders both as an empty table tells the reader the second when the
 * truth is the first.
 */
export type AuditEventsResult =
  | { status: 'OK'; events: AuditEventRow[]; truncated: boolean }
  | { status: 'UNAVAILABLE' };

/**
 * Newest first. Capped rather than paginated for now: a real trail needs
 * filtering by actor, action, scope, and time range, and shipping a bare
 * "next page" button first would let the page imply completeness it cannot
 * offer. `truncated` says plainly when the cap was hit.
 */
export const AUDIT_PAGE_SIZE = 100;

export async function listRecentAuditEvents(): Promise<AuditEventsResult> {
  if (!isDatabaseConfigured()) {
    return { status: 'UNAVAILABLE' };
  }

  const rows = await getDb()
    .select()
    .from(auditEvents)
    .orderBy(desc(auditEvents.occurredAt))
    // One extra row is fetched purely to detect truncation without a
    // second COUNT query.
    .limit(AUDIT_PAGE_SIZE + 1);

  return {
    status: 'OK',
    events: rows.slice(0, AUDIT_PAGE_SIZE),
    truncated: rows.length > AUDIT_PAGE_SIZE,
  };
}

/** Known actions render a label; an unknown one is shown verbatim. */
export function isKnownAction(
  action: string,
  known: readonly string[],
): action is AuditAction {
  return known.includes(action);
}
