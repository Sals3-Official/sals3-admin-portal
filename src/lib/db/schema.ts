import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
