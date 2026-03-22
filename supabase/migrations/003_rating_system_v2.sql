-- =============================================================================
-- 003_rating_system_v2.sql
-- Run this migration after 002_schema_updates.sql
--
-- Adds v2 rating system columns: schema_version, price_paid, value_score.
-- Drops the unique constraint so users can submit a fresh v2 rating for a
-- flavor they already rated under v1.
-- =============================================================================


-- 1. Add new columns to ratings
ALTER TABLE public.ratings
  ADD COLUMN IF NOT EXISTS schema_version integer NOT NULL DEFAULT 1;

ALTER TABLE public.ratings
  ADD COLUMN IF NOT EXISTS price_paid numeric(8,2);

ALTER TABLE public.ratings
  ADD COLUMN IF NOT EXISTS value_score numeric(3,1);


-- 2. Drop the unique constraint so v1 users can re-rate under v2
ALTER TABLE public.ratings
  DROP CONSTRAINT IF EXISTS ratings_user_flavor_unique;


-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_ratings_schema_version
  ON public.ratings(schema_version);

CREATE INDEX IF NOT EXISTS idx_ratings_v2_created
  ON public.ratings(created_at DESC)
  WHERE schema_version = 2;


-- NOTE: The badge tier trigger (update_user_badge_tier) in 001_initial_schema.sql
-- counts ALL ratings regardless of schema_version. This is intentional -- both v1
-- and v2 ratings contribute to a user's badge progression.

-- =============================================================================
-- END OF MIGRATION 003_rating_system_v2.sql
-- =============================================================================
