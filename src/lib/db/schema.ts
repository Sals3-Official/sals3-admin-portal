import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Employee identity, the first real table in Admin Portal's own database
 * (Gate 0: separate from sals3-portal - see AGENTS.md rule 4). There is no
 * public signup route; rows are created only by `npm run create-employee`,
 * which itself refuses to run against a non-local DATABASE_URL. See
 * `src/lib/db/remote-write-guard.ts`.
 */
export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Server-side session store rather than a self-verifying signed cookie, so
 * sign-out (and any future forced revocation) actually invalidates the
 * session rather than merely asking the browser to forget it.
 */
export const employeeSessions = pgTable('employee_sessions', {
  id: text('id').primaryKey(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

/**
 * Who an event is attributable to. Three values because three genuinely
 * different things happen, and collapsing them would make the trail lie:
 *
 *   EMPLOYEE  - a signed-in employee, `actorEmployeeId` set.
 *   ANONYMOUS - nobody proven. A failed sign-in has an attempted address but
 *               no established identity, and recording it as an employee
 *               would assert an identity the request never established.
 *   CLI       - a local operator running a script. `create-employee` has no
 *               session, so no employee row can honestly be named.
 */
export const auditActorTypeEnum = pgEnum('audit_actor_type', [
  'EMPLOYEE',
  'ANONYMOUS',
  'CLI',
]);

/**
 * The immutable record AGENTS.md rule 6 requires: every consequential action
 * records actor, reason, scope, before/after, correlation ID, and time.
 *
 * Those are first-class columns rather than keys inside one `payload` blob
 * on purpose. sals3-portal's own `audit_events` keeps them in untyped
 * `jsonb`, which means nothing stops a caller omitting the reason - the
 * field is a convention there, not a constraint. A `NOT NULL` column is the
 * constraint. `beforeState`/`afterState` stay `jsonb` because their shape
 * genuinely varies by action, but they are separate columns so "what changed"
 * is never a matter of guessing which key someone used.
 *
 * Append-only is enforced by a database trigger (see the migration), not by
 * this file and not by reviewer discipline: `UPDATE` and `DELETE` on this
 * table raise an exception. Rollback of a policy republishes a prior version;
 * it never rewrites history.
 *
 * `actorEmployeeId` is `ON DELETE RESTRICT`, unlike `employeeSessions`'
 * cascade. Removing an employee must not be a way to erase what they did.
 * `actorLabel` additionally snapshots the address as it read at the time, so
 * the trail stays readable even if the employee row is later renamed.
 */
export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    occurredAt: timestamp('occurred_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Groups every event emitted by one logical operation. */
    correlationId: uuid('correlation_id').notNull(),
    actorType: auditActorTypeEnum('actor_type').notNull(),
    actorEmployeeId: uuid('actor_employee_id').references(() => employees.id, {
      onDelete: 'restrict',
    }),
    /** Human-readable actor as it read at the time, e.g. an email address. */
    actorLabel: text('actor_label').notNull(),
    action: text('action').notNull(),
    /** What the action touched, e.g. `employee:<uuid>` or `global`. */
    scope: text('scope').notNull(),
    reason: text('reason').notNull(),
    beforeState: jsonb('before_state'),
    afterState: jsonb('after_state'),
  },
  (table) => [
    // The page reads newest-first; the correlation index supports pulling
    // every event from one operation back together.
    index('audit_events_occurred_at_idx').on(table.occurredAt),
    index('audit_events_correlation_id_idx').on(table.correlationId),
  ],
);
