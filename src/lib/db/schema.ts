import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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

/**
 * The only supplier this platform integrates with today. A value, not a
 * free-text column, so a second provider is a deliberate migration rather
 * than a typo away from silently forking the mapping table's identity.
 */
export const categoryMappingProviderEnum = pgEnum('category_mapping_provider', [
  'CJ_DROPSHIPPING',
]);

/**
 * A decided, curated mapping from one supplier category to a real Sals3 v1
 * taxonomy category (Google Product Taxonomy) - ADR-014's category
 * governance: platform-wide, Admin-Portal-only, because one decision here
 * reclassifies every product any seller sources under that supplier
 * category, in `sals3-portal`.
 *
 * This table only records the *decision*. It does not itself categorise a
 * product: `sals3-portal` owns `provider_category_mappings` and
 * `products.category_id`, and reading this table into that one is a
 * publish/consume step that does not exist yet (2026-08-15) - the missing
 * half of Gate 0's "policy reaches Portal as versioned, published state over
 * a secret-protected server endpoint" (AGENTS.md rule 4). Until that pipe is
 * built, a decision recorded here is real and durable, but inert.
 *
 * Reverses the 2026-08-14 "the supplier's own category IS the Sals3
 * category" auto-mirror decision that `sals3-portal`'s `cj-mirror.ts`
 * implements: the owner decided on 2026-08-15 that every product should
 * carry a real, curated Sals3 category instead of a verbatim copy of the
 * supplier's own text.
 *
 * Versioned by supersession, matching `sals3-portal`'s
 * `provider_category_mappings` and this table's own `audit_events`: a
 * revised decision inserts a new row and marks the old one `SUPERSEDED`
 * rather than overwriting it, so "what did we decide, and when" is never
 * guesswork. The partial unique index enforces at most one `ACTIVE` row per
 * `(provider, external_category_id)` - the same identity
 * `provider_category_mappings` keys on in `sals3-portal`.
 */
export const categoryMappingStatusEnum = pgEnum('category_mapping_status', [
  'ACTIVE',
  'SUPERSEDED',
]);

export const categoryMappingDecisions = pgTable(
  'category_mapping_decisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: categoryMappingProviderEnum('provider').notNull(),
    externalCategoryId: text('external_category_id').notNull(),
    /**
     * The supplier's own category name/path as the reviewer observed it at
     * decision time. There is no live feed into this repository yet, so this
     * is a fact a person looked up and typed in - not fabricated, but also
     * not guaranteed current if the supplier later renames the category.
     */
    observedCategoryName: text('observed_category_name').notNull(),
    sals3CategoryCode: text('sals3_category_code').notNull(),
    /** Denormalized L1>...>L5 path, so the trail reads without a join. */
    sals3CategoryPath: text('sals3_category_path').notNull(),
    status: categoryMappingStatusEnum('status').notNull().default('ACTIVE'),
    /** The prior decision this one replaces, if any. Never deleted. */
    supersedesId: uuid('supersedes_id'),
    decidedByEmployeeId: uuid('decided_by_employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'restrict' }),
    reason: text('reason').notNull(),
    decidedAt: timestamp('decided_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('category_mapping_decisions_active_identity_key')
      .on(table.provider, table.externalCategoryId)
      .where(sql`${table.status} = 'ACTIVE'`),
    index('category_mapping_decisions_external_category_idx').on(
      table.provider,
      table.externalCategoryId,
    ),
  ],
);
