CREATE TYPE "public"."audit_actor_type" AS ENUM('EMPLOYEE', 'ANONYMOUS', 'CLI');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"correlation_id" uuid NOT NULL,
	"actor_type" "audit_actor_type" NOT NULL,
	"actor_employee_id" uuid,
	"actor_label" text NOT NULL,
	"action" text NOT NULL,
	"scope" text NOT NULL,
	"reason" text NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_employee_id_employees_id_fk" FOREIGN KEY ("actor_employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "audit_events_correlation_id_idx" ON "audit_events" USING btree ("correlation_id");--> statement-breakpoint
--
-- Append-only, enforced by the database rather than by application code.
--
-- AGENTS.md rule 6 says the audit trail is immutable and that rollback
-- republishes a prior valid version rather than rewriting history. A rule
-- that lives only in application code is a convention: any future route,
-- script, or hand-run psql session can ignore it, and the damage is exactly
-- the damage an audit trail exists to make impossible.
--
-- This raises on UPDATE and DELETE for every caller, including the
-- application's own role. Correcting a wrong entry is done by appending a
-- correcting event, which is the point.
--
-- TRUNCATE is covered separately: it is not an UPDATE or DELETE and would
-- otherwise bypass a row-level trigger entirely.
CREATE OR REPLACE FUNCTION audit_events_immutable() RETURNS trigger AS $$
BEGIN
	RAISE EXCEPTION 'audit_events is append-only: % is not permitted', TG_OP
		USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER audit_events_no_update
	BEFORE UPDATE ON "audit_events"
	FOR EACH ROW EXECUTE FUNCTION audit_events_immutable();--> statement-breakpoint
CREATE TRIGGER audit_events_no_delete
	BEFORE DELETE ON "audit_events"
	FOR EACH ROW EXECUTE FUNCTION audit_events_immutable();--> statement-breakpoint
CREATE TRIGGER audit_events_no_truncate
	BEFORE TRUNCATE ON "audit_events"
	FOR EACH STATEMENT EXECUTE FUNCTION audit_events_immutable();