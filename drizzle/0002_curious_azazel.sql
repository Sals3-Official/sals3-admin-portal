CREATE TYPE "public"."category_mapping_provider" AS ENUM('CJ_DROPSHIPPING');--> statement-breakpoint
CREATE TYPE "public"."category_mapping_status" AS ENUM('ACTIVE', 'SUPERSEDED');--> statement-breakpoint
CREATE TABLE "category_mapping_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "category_mapping_provider" NOT NULL,
	"external_category_id" text NOT NULL,
	"observed_category_name" text NOT NULL,
	"sals3_category_code" text NOT NULL,
	"sals3_category_path" text NOT NULL,
	"status" "category_mapping_status" DEFAULT 'ACTIVE' NOT NULL,
	"supersedes_id" uuid,
	"decided_by_employee_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category_mapping_decisions" ADD CONSTRAINT "category_mapping_decisions_decided_by_employee_id_employees_id_fk" FOREIGN KEY ("decided_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "category_mapping_decisions_active_identity_key" ON "category_mapping_decisions" USING btree ("provider","external_category_id") WHERE "category_mapping_decisions"."status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "category_mapping_decisions_external_category_idx" ON "category_mapping_decisions" USING btree ("provider","external_category_id");