import { randomUUID } from 'node:crypto';
import type { DbExecutor } from '@/lib/db/client';
import { auditEvents } from '@/lib/db/schema';
import type { AuditAction } from './actions';

export type AuditActor =
  | { type: 'EMPLOYEE'; employeeId: string; label: string }
  /** Nobody proven - a failed sign-in has an attempted address, not an identity. */
  | { type: 'ANONYMOUS'; label: string }
  /** A local operator running a script; there is no session to name. */
  | { type: 'CLI'; label: string };

export type AuditEventInput = {
  actor: AuditActor;
  action: AuditAction;
  scope: string;
  /**
   * Why this happened, in words a person reading the trail months later can
   * use. Required by the type as well as by the column, because "the reason
   * was optional so nobody filled it in" is how audit trails become useless.
   */
  reason: string;
  before?: unknown;
  after?: unknown;
  /**
   * Pass an existing id to tie several events to one operation. Defaults to
   * a fresh id, so a standalone event still has one rather than null.
   */
  correlationId?: string;
};

/**
 * Appends one immutable audit event.
 *
 * Takes a `DbExecutor` rather than calling `getDb()` so a caller can pass its
 * own transaction. That is the whole reason the parameter exists: an audit
 * record that commits when the change it describes was rolled back is worse
 * than no record, because it is a confident lie. Callers that change state
 * should record inside the same transaction.
 *
 * This never swallows its own failure. If the trail cannot be written, the
 * caller should hear about it and decide - silently continuing would mean
 * the system carried on doing consequential work with no memory of it.
 */
export async function recordAuditEvent(
  executor: DbExecutor,
  input: AuditEventInput,
): Promise<string> {
  const correlationId = input.correlationId ?? randomUUID();

  await executor.insert(auditEvents).values({
    correlationId,
    actorType: input.actor.type,
    actorEmployeeId:
      input.actor.type === 'EMPLOYEE' ? input.actor.employeeId : null,
    actorLabel: input.actor.label,
    action: input.action,
    scope: input.scope,
    reason: input.reason,
    beforeState: input.before ?? null,
    afterState: input.after ?? null,
  });

  return correlationId;
}
