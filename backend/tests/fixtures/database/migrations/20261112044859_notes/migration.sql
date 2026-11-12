CREATE SCHEMA "app_data";
--> statement-breakpoint
CREATE TABLE "app_data"."notes" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL
);
