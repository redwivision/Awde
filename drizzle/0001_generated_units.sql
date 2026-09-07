CREATE TABLE "generated_units" (
	"content_hash" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"data" jsonb NOT NULL,
	"source_author_fingerprint" text DEFAULT '' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"hit_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "generated_units_kind_idx" ON "generated_units" USING btree ("kind");