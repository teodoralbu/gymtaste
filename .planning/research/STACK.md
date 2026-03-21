# Stack Research: v1.1 Feature Expansion

**Domain:** Gym supplement review platform - feature additions
**Researched:** 2026-03-21
**Confidence:** MEDIUM (WebSearch unavailable; recommendations based on installed package analysis + training data through May 2025. Supabase and React APIs are stable and well-known.)

## Scope

This document covers ONLY new stack additions needed for v1.1 features. The existing stack (Next.js 16.1.6, React 19.2.3, @supabase/supabase-js 2.99.1, @supabase/ssr 0.9.0, TypeScript 5, Vercel deployment) is not re-evaluated.

---

## Feature-by-Feature Stack Requirements

### 1. Comment Threading (Instagram-style replies, edit/delete)

**New libraries needed:** NONE

**Schema changes required:**

The current `review_comments` table has no `parent_id` column and no `updated_at` column. Both are needed.

```sql
-- Add threading support
ALTER TABLE review_comments
  ADD COLUMN parent_id UUID REFERENCES review_comments(id) ON DELETE CASCADE,
  ADD COLUMN updated_at TIMESTAMPTZ;

CREATE INDEX idx_review_comments_parent_id ON review_comments(parent_id);
```

**RLS policy changes:**

The current schema has no UPDATE policy on `review_comments`. One is needed for edit functionality.

```sql
CREATE POLICY "review_comments: owner update"
  ON review_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Why no library:** Threading is a simple recursive parent_id pattern. Instagram-style means max 1 level deep (replies to comments, no replies to replies), which simplifies to a flat `WHERE parent_id = :comment_id` query. No tree traversal library needed.

**Implementation pattern:** Query top-level comments (`WHERE parent_id IS NULL AND rating_id = :id`), then batch-fetch replies (`WHERE parent_id IN (:top_level_ids)`). Two queries, no recursion.

---

### 2. Notification System

**New libraries needed:** NONE

**Decision: Polling, NOT Supabase Realtime.**

**Why polling over Realtime:**
- The existing notifications page already works via server-side queries (likes, comments, follows aggregated on page load). This is the right architecture.
- Supabase Realtime adds client-side WebSocket connections, which means: (a) client components required for subscription, (b) connection management complexity, (c) Supabase free tier limits on concurrent Realtime connections, (d) no benefit for a page the user visits occasionally.
- Polling on page visit (current pattern) or with a lightweight client-side interval (every 60s) is sufficient for a social app at this scale.
- If "real-time" badge count in the navbar is desired, a simple `setInterval` fetch to a `/api/notifications/count` route is far simpler than Realtime subscriptions.

**Schema changes required:**

The current notifications page has NO dedicated notifications table -- it reconstructs notifications by querying likes, comments, and follows at render time. This works but has problems: (a) no read/unread tracking, (b) can't support "new since last visit" badge, (c) re-queries every page load.

A dedicated notifications table is recommended:

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
  rating_id   UUID        REFERENCES ratings(id) ON DELETE CASCADE,
  comment_id  UUID        REFERENCES review_comments(id) ON DELETE CASCADE,
  is_read     BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: owner read"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications: owner update read status"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Trigger-based population:** Use PostgreSQL triggers on `review_likes`, `review_comments`, and `follows` to INSERT into the notifications table automatically. This keeps notification creation in the DB layer (consistent, no missed events) and decouples it from application code.

```sql
-- Example: trigger on review_likes INSERT
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify yourself
  IF NEW.user_id != (SELECT user_id FROM ratings WHERE id = NEW.rating_id) THEN
    INSERT INTO notifications (user_id, actor_id, type, rating_id)
    VALUES (
      (SELECT user_id FROM ratings WHERE id = NEW.rating_id),
      NEW.user_id,
      'like',
      NEW.rating_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 3. Rating System Overhaul (new dimensions, price, value score)

**New libraries needed:** NONE

**Schema changes required:**

The existing `category_rating_dimensions` table already supports per-category dimensions with weights. The `ratings.scores` JSONB column already stores arbitrary dimension scores. The schema is already designed for this. The overhaul is primarily a frontend + data migration concern.

Key additions needed:

```sql
-- Products already have price_per_serving and servings_per_container
-- Add total_price for value score calculation
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS total_price DECIMAL(8,2);

-- Ratings: add schema_version to distinguish old vs new ratings
ALTER TABLE ratings
  ADD COLUMN IF NOT EXISTS schema_version INTEGER DEFAULT 1;
```

**Value score calculation:** `value_score = overall_score / price_per_serving`. This is a derived value, best computed at query time or stored as a generated column. No library needed -- it is basic arithmetic.

**Important:** The PROJECT.md states "Old reviews (pre-v1.1 rating schema) will be hidden once new system launches." This means a `schema_version` column on ratings is the cleanest way to filter. Old ratings get `schema_version = 1`, new ones get `schema_version = 2`. Leaderboard and feed queries add `WHERE schema_version = 2`.

---

### 4. Swipeable Leaderboard Category Tabs

**New libraries needed:** NONE (recommended approach), or ONE optional library.

**Recommended: CSS scroll-snap + native touch.**

The existing app uses custom CSS variables (no Tailwind at runtime). A swipeable tab interface is achievable with:

```css
.tab-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}
.tab-container::-webkit-scrollbar { display: none; }
.tab-panel {
  scroll-snap-align: start;
  flex: 0 0 100%;
  min-width: 100%;
}
```

This gives native-feeling swipe on mobile with zero JS dependencies. The tab bar above (Best Flavor, Best Pump, Best Value, Best Overall) updates the active indicator via a small `useState` + `IntersectionObserver` or `scrollLeft` check.

**Why no swipe library:**
- CSS `scroll-snap` has full browser support (98%+ globally).
- The leaderboard is a simple horizontal tab switch, not a complex gesture system.
- Libraries like `react-swipeable` or `swiper` add 10-50KB for functionality CSS handles natively.
- The app already avoids unnecessary dependencies (only 5 production deps).

**Alternative if gesture detection is needed:**

| Library | Size | When to Use |
|---------|------|-------------|
| `react-swipeable` | ~3KB gzipped | If you need programmatic swipe detection (e.g., swipe callbacks, velocity thresholds). Only if CSS scroll-snap feels insufficient. |

**Schema changes for category leaderboards:**

The current leaderboard query fetches all ratings and sorts by `overall_score`. For category tabs (Best Flavor, Best Pump, Best Value, Best Overall), the query needs to sort by specific dimension scores from the `scores` JSONB.

No schema change needed -- the `ratings.scores` JSONB already contains per-dimension scores like `{"flavor": 8, "pump": 7, "energy": 9}`. The leaderboard query just changes the sort key.

However, for performance, a materialized view or indexed computed columns would help at scale:

```sql
-- Materialized view for leaderboard (replaces the 2000-row stopgap)
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_stats AS
SELECT
  f.id AS flavor_id,
  f.name AS flavor_name,
  f.slug AS flavor_slug,
  p.id AS product_id,
  p.name AS product_name,
  p.slug AS product_slug,
  p.category_id,
  p.price_per_serving,
  b.name AS brand_name,
  b.slug AS brand_slug,
  COUNT(r.id) AS rating_count,
  AVG(r.overall_score) AS avg_overall,
  AVG((r.scores->>'flavor')::numeric) AS avg_flavor,
  AVG((r.scores->>'pump')::numeric) AS avg_pump,
  AVG((r.scores->>'energy')::numeric) AS avg_energy,
  AVG(CASE WHEN p.price_per_serving > 0
    THEN r.overall_score / p.price_per_serving END) AS avg_value,
  (COUNT(r.id) FILTER (WHERE r.would_buy_again))::float
    / NULLIF(COUNT(r.id), 0) * 100 AS wba_pct
FROM ratings r
JOIN flavors f ON f.id = r.flavor_id
JOIN products p ON p.id = f.product_id
JOIN brands b ON b.id = p.brand_id
WHERE r.schema_version = 2
GROUP BY f.id, f.name, f.slug, p.id, p.name, p.slug, p.category_id,
         p.price_per_serving, b.name, b.slug;

-- Refresh periodically (via pg_cron or application-triggered)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_stats;
```

This replaces the current 2000-row stopgap mentioned in PROJECT.md key decisions.

---

### 5. Supplement Dosage Calculator

**New libraries needed:** NONE

**Why no library:** Supplement dosing is simple arithmetic with lookup tables. Common formulas:

| Supplement | Standard Dose | Body-weight Adjusted |
|------------|---------------|---------------------|
| Creatine (loading) | 0.3g/kg/day for 5-7 days | 0.3 * weight_kg |
| Creatine (maintenance) | 3-5g/day (flat) | 0.03g/kg for precision |
| Protein | 1.6-2.2g/kg/day | Based on goal (cut vs bulk) |
| Caffeine | 3-6mg/kg pre-workout | 3 * weight_kg to 6 * weight_kg |
| Beta-alanine | 3.2-6.4g/day (flat) | Not weight-dependent |
| Citrulline | 6-8g/day (flat) | Not weight-dependent |

These are hardcoded constants, not computed formulas requiring a math library. A TypeScript object with the lookup data and a pure function is all that's needed.

**Schema changes required:**

The `users` table needs height, weight, and goal fields for the calculator:

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
  ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,1) CHECK (weight_kg > 0 AND weight_kg < 500),
  ADD COLUMN IF NOT EXISTS fitness_goal TEXT CHECK (fitness_goal IN ('cut', 'maintain', 'bulk'));
```

**Important safety note:** The calculator must display a disclaimer ("This is not medical advice. Consult a healthcare provider.") and cite dosage sources (e.g., ISSN position stands). This is a legal/UX concern, not a stack concern.

---

### 6. Nutritional Values Per-Quantity Slider

**New libraries needed:** NONE

**Why no library:** A range slider is a native HTML `<input type="range">` element. The product page already displays nutritional data (caffeine_mg, citrulline_g, beta_alanine_g). The slider multiplies displayed values by `(selected_servings / 1)`. Pure arithmetic, zero dependencies.

**Schema changes required:**

The products table already has `caffeine_mg`, `citrulline_g`, `beta_alanine_g`, `servings_per_container`. These are per-serving values. The slider just multiplies by the user's selected serving count.

Additional nutritional columns may be needed depending on scope:

```sql
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS calories_per_serving INTEGER,
  ADD COLUMN IF NOT EXISTS protein_g DECIMAL(5,1),
  ADD COLUMN IF NOT EXISTS carbs_g DECIMAL(5,1),
  ADD COLUMN IF NOT EXISTS fat_g DECIMAL(5,1),
  ADD COLUMN IF NOT EXISTS sodium_mg INTEGER,
  ADD COLUMN IF NOT EXISTS sugar_g DECIMAL(5,1);
```

---

## Recommended Stack Summary

### New Libraries to Install

**NONE.**

Every v1.1 feature is implementable with the existing stack:
- **@supabase/supabase-js 2.99.1** -- already supports all needed DB operations
- **React 19.2.3** -- `useState` for sliders, tabs, edit states
- **Next.js 16.1.6 App Router** -- server components for data fetching, route handlers for API endpoints
- **CSS scroll-snap** -- native browser API for swipeable tabs
- **HTML `<input type="range">`** -- native for nutritional slider
- **PostgreSQL** -- triggers for notifications, JSONB for flexible rating scores, materialized views for leaderboard performance

### Supporting Libraries (Already Installed)

| Library | Version | Used For in v1.1 |
|---------|---------|-----------------|
| @supabase/supabase-js | 2.99.1 | All DB operations, RLS, triggers |
| @supabase/ssr | 0.9.0 | Server-side auth for notification ownership checks |
| next | 16.1.6 | Route handlers for notification count API, server components |
| react | 19.2.3 | Client interactivity (slider, tabs, edit/delete UI) |

### Development Tools (Already Installed)

| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript | Type safety | Update types.ts with new table interfaces |
| ESLint | Linting | No changes needed |

---

## Schema Changes Summary (All Features)

### New Tables

| Table | Purpose |
|-------|---------|
| `notifications` | Dedicated notification storage with read/unread tracking |

### Altered Tables

| Table | Change | Purpose |
|-------|--------|---------|
| `review_comments` | Add `parent_id UUID`, `updated_at TIMESTAMPTZ` | Threading + edit tracking |
| `ratings` | Add `schema_version INTEGER DEFAULT 1` | Distinguish old vs new rating schema |
| `users` | Add `height_cm`, `weight_kg`, `fitness_goal` | Dosage calculator inputs |
| `products` | Add `total_price`, `calories_per_serving`, `protein_g`, `carbs_g`, `fat_g`, `sodium_mg`, `sugar_g` | Full nutritional data + value score |

### New RLS Policies

| Table | Policy | Purpose |
|-------|--------|---------|
| `review_comments` | Owner UPDATE | Edit own comments |
| `notifications` | Owner SELECT | Read own notifications |
| `notifications` | Owner UPDATE | Mark as read |

### New Triggers

| Trigger | On | Purpose |
|---------|-----|---------|
| `notify_on_like` | `review_likes` INSERT | Auto-create like notification |
| `notify_on_comment` | `review_comments` INSERT | Auto-create comment notification |
| `notify_on_follow` | `follows` INSERT | Auto-create follow notification |

### New Views

| View | Purpose |
|------|---------|
| `leaderboard_stats` (materialized) | Pre-aggregated leaderboard data by dimension, replacing 2000-row stopgap |

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Polling for notifications | Supabase Realtime | Adds WebSocket complexity, client component requirements, connection limits. Polling is sufficient at this scale. |
| CSS scroll-snap for tabs | Swiper.js / react-swipeable | 10-50KB added for what CSS does natively. App has only 5 prod deps -- keep it lean. |
| PostgreSQL triggers for notifications | Application-layer notification creation | Triggers are more reliable (no missed events from code paths), centralized, and run in the same transaction. |
| Materialized view for leaderboard | Application-layer caching | DB-level aggregation is more correct and easier to maintain than in-memory JS aggregation of 2000 rows. |
| Hardcoded dosage formulas | External nutrition API | APIs add latency, cost, and a runtime dependency for data that changes rarely. ISSN guidelines are stable. |
| Native `<input type="range">` | rc-slider / react-slider | The native element is styled with CSS custom properties (which the app already uses). No library needed for a single slider. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Supabase Realtime (for notifications) | Overkill for occasional page visits. Adds client-side WebSocket complexity, concurrent connection limits on free tier. | Server-side query on page load + optional polling interval for badge count. |
| Swiper.js | 50KB+ library for horizontal tab swiping that CSS scroll-snap handles natively. | `scroll-snap-type: x mandatory` + `scroll-snap-align: start` |
| Any nutrition/dosage API | Runtime dependency for static reference data. Adds latency, cost, failure modes. | Hardcoded lookup table in TypeScript based on published ISSN position stands. |
| react-query / SWR for notification polling | The app uses server components exclusively. Adding a client-side data fetching layer for one feature creates architectural inconsistency. | A small client component with `useEffect` + `setInterval` + `fetch('/api/notifications/count')` for the badge count. Everything else stays server-rendered. |
| A separate comments microservice | Over-engineering for threaded comments. The existing Supabase table with a `parent_id` column is sufficient. | Direct Supabase queries with `parent_id` filtering. |

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| @supabase/supabase-js | 2.99.1 | PostgreSQL triggers, materialized views, JSONB queries | All features use standard PostgreSQL -- no Supabase-specific extensions needed beyond what's already used. |
| Next.js | 16.1.6 | Route Handlers for API endpoints | `/api/notifications/count` route handler for polling. Server components for all page renders. |
| React | 19.2.3 | Client components for interactive elements | Slider, swipeable tabs, edit/delete UI need `'use client'` components. Keep these leaf-level. |

## Supabase Features Used (Existing vs New)

| Feature | Status | Used For |
|---------|--------|----------|
| Auth | Existing | Login, session, RLS identity |
| Database (PostgREST) | Existing | All queries |
| Storage | Existing | Avatars, review photos |
| Row Level Security | Existing + new policies | Notification ownership, comment editing |
| PostgreSQL Triggers | Existing (badge tier) + new | Notification creation on like/comment/follow |
| Materialized Views | NEW | Leaderboard performance (replaces 2000-row stopgap) |
| Realtime | NOT USED | Intentionally avoided -- polling is sufficient |
| Edge Functions | NOT USED | Not needed for v1.1 features |

---

## Sources

- Installed package versions from `package.json` and `node_modules/@supabase/supabase-js/package.json` -- HIGH confidence
- Existing schema from `supabase/migrations/001_initial_schema.sql` and `002_schema_updates.sql` -- HIGH confidence
- Existing types from `src/lib/types.ts` -- HIGH confidence
- Existing queries from `src/lib/queries.ts` -- HIGH confidence
- Existing leaderboard and notifications pages -- HIGH confidence
- Supplement dosage ranges from ISSN (International Society of Sports Nutrition) published position stands -- MEDIUM confidence (training data, not live-verified)
- CSS scroll-snap browser support -- HIGH confidence (well-established spec since 2020)
- Supabase Realtime limitations and pricing -- MEDIUM confidence (training data, recommend verifying current free tier limits)

---
*Stack research for: GymTaste v1.1 Feature Expansion*
*Researched: 2026-03-21*
