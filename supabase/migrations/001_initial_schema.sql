-- =============================================================================
-- GymTaste — Initial Schema Migration
-- Version: 001
-- Created: 2026-03-14
-- Description: Full initial schema including enums, tables, indexes, RLS
--              policies, helper functions, and triggers.
-- =============================================================================


-- =============================================================================
-- SECTION 1: ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE badge_tier_enum AS ENUM (
    'fresh_meat',
    'first_rep',
    'taster',
    'consistent',
    'flavor_hunter',
    'supplement_scholar',
    'connoisseur',
    'elite_palate',
    'gym_rat',
    'legend'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_reason_enum AS ENUM (
    'false_info',
    'spam',
    'offensive',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status_enum AS ENUM (
    'pending',
    'reviewed',
    'resolved'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE submission_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- =============================================================================
-- SECTION 2: TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- categories
-- Represents top-level product categories (e.g. Pre-Workout, Protein, BCAA).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,
  icon        TEXT,
  is_active   BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- category_rating_dimensions
-- Defines which scoring dimensions exist per category and their relative weight.
-- Example: Pre-Workout might weight "energy" heavily; Protein might weight
-- "mixability" heavily. All weights for a given category should sum to 1.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS category_rating_dimensions (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID         NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name            TEXT         NOT NULL,
  weight          DECIMAL(4,3) NOT NULL CHECK (weight > 0 AND weight <= 1),
  display_order   INTEGER      NOT NULL,
  created_at      TIMESTAMPTZ  DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- users
-- Public profile data extending Supabase auth.users.
-- Row is created via trigger or application code after auth sign-up.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          UUID             PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT             UNIQUE NOT NULL,
  email       TEXT             UNIQUE NOT NULL,
  avatar_url  TEXT,
  bio         TEXT             CHECK (char_length(bio) <= 160),
  badge_tier  badge_tier_enum  DEFAULT 'fresh_meat',
  created_at  TIMESTAMPTZ      DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- brands
-- Supplement brands (e.g. Optimum Nutrition, Ghost, C4).
-- Managed by admins; users submit via product_submissions.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brands (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- products
-- Individual supplement products belonging to a brand and category.
-- Nutritional data fields are optional to accommodate partial data at launch.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id              UUID         NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  category_id           UUID         NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name                  TEXT         NOT NULL,
  slug                  TEXT         UNIQUE NOT NULL,
  description           TEXT,
  image_url             TEXT,
  caffeine_mg           INTEGER,
  citrulline_g          DECIMAL(5,2),
  beta_alanine_g        DECIMAL(5,2),
  price_per_serving     DECIMAL(6,2),
  servings_per_container INTEGER,
  barcode               TEXT,
  is_approved           BOOLEAN      DEFAULT true,
  submitted_by          UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ  DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- flavors
-- Each product can have multiple flavors (e.g. Blue Raspberry, Watermelon).
-- Ratings are attached to a specific flavor, not just the product.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flavors (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- flavor_tags
-- Taxonomy tags that describe a flavor profile (e.g. "fruity", "candy", "sour").
-- Managed by admins; used to help users discover flavors.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flavor_tags (
  id    UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT  UNIQUE NOT NULL,
  slug  TEXT  UNIQUE NOT NULL
);

-- -----------------------------------------------------------------------------
-- flavor_tag_assignments
-- Many-to-many join between flavors and flavor_tags.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flavor_tag_assignments (
  flavor_id  UUID  NOT NULL REFERENCES flavors(id) ON DELETE CASCADE,
  tag_id     UUID  NOT NULL REFERENCES flavor_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (flavor_id, tag_id)
);

-- -----------------------------------------------------------------------------
-- ratings
-- A user's scored review of a specific flavor.
-- Users CAN rate the same flavor multiple times (e.g. new batch, updated opinion).
-- The scores JSONB structure mirrors the category_rating_dimensions for the
-- product's category. overall_score is a computed weighted average stored at
-- write time by the application layer.
--
-- Example scores shape: {"taste": 8, "sweetness": 6, "mixability": 7, "aftertaste": 7}
-- context_tags example: ['post-workout', 'fasted', 'mixed-with-milk']
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ratings (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flavor_id       UUID         NOT NULL REFERENCES flavors(id) ON DELETE CASCADE,
  scores          JSONB        NOT NULL,
  overall_score   DECIMAL(4,2) NOT NULL,
  would_buy_again BOOLEAN      NOT NULL,
  context_tags    TEXT[]       DEFAULT '{}',
  review_text     TEXT         CHECK (char_length(review_text) <= 280),
  created_at      TIMESTAMPTZ  DEFAULT now()
  -- NOTE: No UNIQUE constraint on (user_id, flavor_id) — multiple ratings allowed.
);

-- -----------------------------------------------------------------------------
-- review_likes
-- A user can like a rating once. Soft engagement signal.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS review_likes (
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating_id  UUID        NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, rating_id)
);

-- -----------------------------------------------------------------------------
-- review_comments
-- Short-form comments on a rating (max 280 chars, Twitter-style).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS review_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id  UUID        NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT        NOT NULL CHECK (char_length(text) <= 280),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- follows
-- Social graph — users can follow other users.
-- Self-follows are blocked via CHECK constraint.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS follows (
  follower_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- -----------------------------------------------------------------------------
-- reports
-- Users can report ratings for moderation review.
-- Moderation status transitions: pending -> reviewed -> resolved
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id           UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating_id    UUID                NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  reason       report_reason_enum  NOT NULL,
  description  TEXT                CHECK (char_length(description) <= 500),
  status       report_status_enum  DEFAULT 'pending',
  created_at   TIMESTAMPTZ         DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- product_submissions
-- User-submitted product/flavor data for admin review before going live.
-- On approval, admin creates the actual brands/products/flavors records.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_submissions (
  id           UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_name   TEXT                    NOT NULL,
  product_name TEXT                    NOT NULL,
  flavor_name  TEXT                    NOT NULL,
  barcode      TEXT,
  image_url    TEXT,
  status       submission_status_enum  DEFAULT 'pending',
  created_at   TIMESTAMPTZ             DEFAULT now()
);


-- =============================================================================
-- SECTION 3: INDEXES
-- =============================================================================

-- ratings — most frequently queried by flavor, user, and recency
CREATE INDEX IF NOT EXISTS idx_ratings_flavor_id    ON ratings(flavor_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id      ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at   ON ratings(created_at DESC);

-- follows — queried in both directions for follower/following lists
CREATE INDEX IF NOT EXISTS idx_follows_follower_id  ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- products — filtered by category and brand on browse pages
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id    ON products(brand_id);

-- review_likes — aggregated per rating for like counts
CREATE INDEX IF NOT EXISTS idx_review_likes_rating_id    ON review_likes(rating_id);

-- review_comments — fetched per rating for comment threads
CREATE INDEX IF NOT EXISTS idx_review_comments_rating_id ON review_comments(rating_id);

-- products — partial index for approved product browsing (most common query path)
CREATE INDEX IF NOT EXISTS idx_products_is_approved
  ON products(is_approved)
  WHERE is_approved = true;


-- =============================================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on every table
ALTER TABLE categories                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_rating_dimensions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE products                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE flavors                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE flavor_tags                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE flavor_tag_assignments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_submissions         ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Read-only tables (admin writes via service role, public reads)
-- categories, category_rating_dimensions, brands, products, flavors,
-- flavor_tags, flavor_tag_assignments
-- -----------------------------------------------------------------------------

CREATE POLICY "categories: public read"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "category_rating_dimensions: public read"
  ON category_rating_dimensions FOR SELECT
  USING (true);

CREATE POLICY "brands: public read"
  ON brands FOR SELECT
  USING (true);

CREATE POLICY "products: public read"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "flavors: public read"
  ON flavors FOR SELECT
  USING (true);

CREATE POLICY "flavor_tags: public read"
  ON flavor_tags FOR SELECT
  USING (true);

CREATE POLICY "flavor_tag_assignments: public read"
  ON flavor_tag_assignments FOR SELECT
  USING (true);

-- -----------------------------------------------------------------------------
-- users
-- Anyone can read profiles; only the owner can update their own row.
-- -----------------------------------------------------------------------------

CREATE POLICY "users: public read"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "users: authenticated insert own row"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users: owner update"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- ratings
-- Anyone can read ratings. Authenticated users can insert ratings.
-- Only the author can delete their own rating.
-- -----------------------------------------------------------------------------

CREATE POLICY "ratings: public read"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "ratings: authenticated insert"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ratings: owner delete"
  ON ratings FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- review_likes
-- Anyone can read likes. Authenticated users can insert/delete their own likes.
-- -----------------------------------------------------------------------------

CREATE POLICY "review_likes: public read"
  ON review_likes FOR SELECT
  USING (true);

CREATE POLICY "review_likes: authenticated insert"
  ON review_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "review_likes: owner delete"
  ON review_likes FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- review_comments
-- Anyone can read comments. Authenticated users can insert.
-- Only the author can delete their own comment.
-- -----------------------------------------------------------------------------

CREATE POLICY "review_comments: public read"
  ON review_comments FOR SELECT
  USING (true);

CREATE POLICY "review_comments: authenticated insert"
  ON review_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "review_comments: owner delete"
  ON review_comments FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- follows
-- Anyone can read the social graph. Authenticated users can follow/unfollow,
-- but only as themselves (follower_id = auth.uid()).
-- -----------------------------------------------------------------------------

CREATE POLICY "follows: public read"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "follows: authenticated insert as follower"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows: owner delete as follower"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- -----------------------------------------------------------------------------
-- reports
-- Authenticated users can submit reports. Users can only read their own reports.
-- Admins read all reports via service role (bypasses RLS).
-- -----------------------------------------------------------------------------

CREATE POLICY "reports: authenticated insert"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports: owner read"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- -----------------------------------------------------------------------------
-- product_submissions
-- Authenticated users can submit. Users can only read their own submissions.
-- Admins manage all submissions via service role (bypasses RLS).
-- -----------------------------------------------------------------------------

CREATE POLICY "product_submissions: authenticated insert"
  ON product_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "product_submissions: owner read"
  ON product_submissions FOR SELECT
  USING (auth.uid() = user_id);


-- =============================================================================
-- SECTION 5: RATE LIMITING NOTE
-- =============================================================================

-- Rate limiting is enforced at the APPLICATION LAYER, not at the database level.
--
-- Limits (V1):
--   - Ratings:  20 per user per hour
--   - Comments: 50 per user per hour
--
-- Implementation approach:
--   The API / Supabase Edge Function checks the count of rows in `ratings` and
--   `review_comments` created by auth.uid() within the last 60 minutes before
--   allowing an INSERT. If the count exceeds the threshold, the request is
--   rejected with HTTP 429.
--
-- Example check query (run by application before insert):
--
--   SELECT COUNT(*) FROM ratings
--   WHERE user_id = auth.uid()
--     AND created_at > now() - INTERVAL '1 hour';
--
-- A database-level solution (e.g. pg_cron + rate limit table) may be added in
-- a future migration once scale warrants it.


-- =============================================================================
-- SECTION 6: HELPER FUNCTION — BADGE TIER CALCULATION
-- =============================================================================

-- Returns the correct badge tier based on total rating count.
-- Thresholds:
--   0–4   ratings  → rookie
--   5–14  ratings  → taster
--   15–34 ratings  → flavor_hunter
--   35–74 ratings  → connoisseur
--   75+   ratings  → gym_rat

CREATE OR REPLACE FUNCTION calculate_badge_tier(rating_count INTEGER)
RETURNS badge_tier_enum AS $$
BEGIN
  IF rating_count >= 75 THEN
    RETURN 'gym_rat';
  ELSIF rating_count >= 35 THEN
    RETURN 'connoisseur';
  ELSIF rating_count >= 15 THEN
    RETURN 'flavor_hunter';
  ELSIF rating_count >= 5 THEN
    RETURN 'taster';
  ELSE
    RETURN 'fresh_meat';
  END IF;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- SECTION 7: TRIGGER — AUTO-UPDATE BADGE TIER ON NEW RATING
-- =============================================================================

-- Trigger function: recalculates and persists the badge tier for the
-- user who just inserted a rating. Runs as SECURITY DEFINER so it can
-- write to the users table regardless of RLS on the calling session.

CREATE OR REPLACE FUNCTION update_user_badge_tier()
RETURNS TRIGGER AS $$
DECLARE
  total_ratings INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO total_ratings
  FROM ratings
  WHERE user_id = NEW.user_id;

  UPDATE users
  SET badge_tier = calculate_badge_tier(total_ratings)
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to ratings table — fires after every INSERT.
CREATE TRIGGER trigger_update_badge_tier
  AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_badge_tier();


-- =============================================================================
-- END OF MIGRATION 001_initial_schema.sql
-- =============================================================================
