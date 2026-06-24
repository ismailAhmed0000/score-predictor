ALTER TABLE "match_predictions" ADD COLUMN "predicted_top_scorer" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "top_scorer_name" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "top_scorer_goals" integer;