# Architecture Patterns

**Domain:** Gym supplement review platform -- v1.1 feature expansion
**Researched:** 2026-03-21

## Existing Architecture Snapshot

The app follows a straightforward Next.js App Router pattern:

- **Server Components** for pages (`/leaderboard`, `/products/[slug]`, `/flavors/[slug]`, `/users/[username]`, `/notifications`)
- **Client Components** for interactive UI (`CommentsSection`, `LikeButton`, `RatingForm`, `FollowButton`, `FeedList`)
- **Server Actions** for cursor-based feed pagination (`app/actions/feed.ts`)
- **`lib/queries.ts`** as the central server-side data access layer (no ORM, raw Supabase client queries)
- **`lib/types.ts`** as the single source of truth for DB row types and the `Database` generic
- **`lib/constants.ts`** for rating dimensions, badge tiers, score colors
- **`context/auth-context.tsx`** for client-side auth state (Supabase auth + user profile)
- **Custom CSS variables** (no Tailwind in most components; settings page uses some utility classes)

### Current DB Tables (from `types.ts` Database type)

```
categories, category_rating_dimensions, users, brands, products, flavors,
flavor_tags, flavor_tag_assignments, ratings, review_likes, review_comments,
follows, reports, product_submissions, reps, rep_likes
```

### Key Architectural Facts

1. **Notifications page exists** but is computed on-the-fly from `review_likes`, `review_comments`, and `follows` tables -- no dedicated notifications table.
2. **Comments are flat** -- `review_comments` has `id, rating_id, user_id, text, created_at`. No `parent_id`, no `updated_at`, no soft-delete.
3. **Rating scores** stored as JSONB `scores: Record<string, number>` with keys `taste, sweetness, pump, energy, intensity` and weights defined in `constants.ts`.
4. **Leaderboard** currently ranks by `overall_score` only, fetching up to 2000 rows with no category filtering.
5. **User table** has `id, username, email, avatar_url, bio, badge_tier, xp, created_at` -- no physical profile fields (height, weight, goal).
6. **Product table** already has `caffeine_mg, citrulline_g, beta_alanine_g, price_per_serving, servings_per_container` -- partial nutritional data exists.

---

## Recommended Architecture for v1.1

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `review_comments` table (modified) | Threaded comments with edit/delete | CommentsSection, notifications |
| `notifications` table (new) | Persistent notification storage | NotificationsPage, NavBar badge, LikeButton, FollowButton, CommentsSection |
| `ratings` table (modified) | New score dimensions + price_paid | RatingForm, queries.ts, leaderboard |
| `users` table (modified) | Profile fields for calculator | SettingsPage, SupplementCalculator |
| `products` table (modified) | Expanded nutritional data | ProductPage, NutritionalDisplay |
| SupplementCalculator (new component) | Client-side dosage calc | User profile data, product specs |
| NutritionalDisplay (new component) | Per-scoop/serving/100g slider | Product data |
| LeaderboardTabs (new component) | Swipeable dimension tabs | Leaderboard queries |

### Data Flow Changes

```
CURRENT:
  LikeButton -> review_likes table -> (notification page computes on read)
  FollowButton -> follows table -> (notification page computes on read)

PROPOSED:
  LikeButton -> review_likes table + INSERT into notifications table
  FollowButton -> follows table + INSERT into notifications table
  CommentsSection -> review_comments table + INSERT into notifications table
  NavBar -> polls/subscribes to notifications table for unread count
```

---

## DB Schema Changes (Specific)

### 1. Modify `review_comments` -- Add threading + edit/delete

```sql
ALTER TABLE review_comments
  ADD COLUMN parent_id UUID REFERENCES review_comments(id) ON DELETE CASCADE DEFAULT NULL,
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_review_comments_parent_id ON review_comments(parent_id);
CREATE INDEX idx_review_comments_rating_id ON review_comments(rating_id);
```

**Type change in `types.ts`:**
```typescript
export interface ReviewComment {
  id: string
  rating_id: string
  user_id: string
  text: string
  parent_id: string | null       // NEW
  updated_at: string | null      // NEW
  is_deleted: boolean             // NEW
  created_at: string
}
```

**Rationale:**
- `parent_id` enables one level of threading (reply to comment). Keep it single-depth like Instagram -- replies to replies still reference the same `parent_id` (the top-level comment), not nested.
- `is_deleted` for soft-delete so threads remain coherent (show "deleted comment" placeholder). Hard-deleting a parent would orphan replies.
- `updated_at` for "edited" marker display.

### 2. New `notifications` table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'reply')),
  rating_id UUID REFERENCES ratings(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES review_comments(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read) WHERE is_read = FALSE;
```

**Type in `types.ts`:**
```typescript
export interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: 'like' | 'comment' | 'follow' | 'reply'
  rating_id: string | null
  comment_id: string | null
  is_read: boolean
  created_at: string
}
```

**Rationale:**
- Replaces the current on-the-fly computation in `notifications/page.tsx` which queries 3 tables and assembles results. That approach does not scale, cannot track read/unread state, and cannot be polled for badge counts.
- `actor_id` + `type` + contextual FK (`rating_id`, `comment_id`) gives enough info to render any notification.
- Dual-write pattern: when a like/follow/comment happens, also insert a notification row. Use Supabase database functions (triggers) or insert in the same server action.
- The `reply` type covers threaded comment replies specifically, so the recipient is the parent comment author.

### 3. Modify `ratings` -- New dimensions + price_paid

```sql
-- Add new score dimension columns (optional per-rating, for products that support them)
-- NOTE: scores JSONB already stores arbitrary keys, so new dimensions are a constants.ts change.
-- The JSONB approach means NO schema migration needed for the scores themselves.

ALTER TABLE ratings
  ADD COLUMN price_paid NUMERIC(6,2) DEFAULT NULL,
  ADD COLUMN schema_version INTEGER DEFAULT 1;
```

**Changes in `constants.ts`:**
```typescript
// v1.1 rating dimensions -- replace the old set
export const RATING_DIMENSIONS = [
  { key: 'flavor',       label: 'Flavor',         weight: 0.30 },
  { key: 'pump',         label: 'Pump',           weight: 0.25 },
  { key: 'energy_focus', label: 'Energy & Focus',  weight: 0.25 },
  { key: 'sweetness',    label: 'Sweetness',      weight: 0.10 },
  { key: 'mixability',   label: 'Mixability',     weight: 0.10 },
] as const
```

**Rationale:**
- The existing `scores` JSONB column is flexible by design -- new dimension keys are just new entries in the JSON. No ALTER TABLE needed for the dimension change.
- `price_paid` is a new float column on `ratings` so users can record what they paid. Combined with `servings_per_container` on the product, this enables a computed value score.
- `schema_version` on ratings distinguishes old (v1) from new (v1.1) ratings. The query layer uses this to filter: old reviews hidden on the frontend, not deleted from DB.
- The `taste` key becomes `flavor`, and `energy` + `intensity` merge into `energy_focus`. Old ratings with old keys remain in JSONB but are not displayed.

**Type change in `types.ts`:**
```typescript
export interface Rating {
  id: string
  user_id: string
  flavor_id: string
  scores: Record<string, number>
  overall_score: number
  would_buy_again: boolean
  context_tags: string[]
  review_text: string | null
  photo_url: string | null
  price_paid: number | null      // NEW
  schema_version: number          // NEW (1 = old, 2 = v1.1)
  created_at: string
}
```

### 4. Modify `users` -- Profile fields for calculator

```sql
ALTER TABLE users
  ADD COLUMN height_cm NUMERIC(5,1) DEFAULT NULL,
  ADD COLUMN weight_kg NUMERIC(5,1) DEFAULT NULL,
  ADD COLUMN goal TEXT DEFAULT NULL CHECK (goal IN ('bulk', 'cut', 'maintain', 'performance'));
```

**Type change in `types.ts`:**
```typescript
export interface User {
  id: string
  username: string
  email: string
  avatar_url: string | null
  bio: string | null
  badge_tier: BadgeTier
  xp: number
  height_cm: number | null        // NEW
  weight_kg: number | null        // NEW
  goal: string | null             // NEW
  created_at: string
}
```

### 5. Modify `products` -- Expanded nutritional data

```sql
ALTER TABLE products
  ADD COLUMN scoop_size_g NUMERIC(5,1) DEFAULT NULL,
  ADD COLUMN protein_per_scoop_g NUMERIC(5,1) DEFAULT NULL,
  ADD COLUMN calories_per_scoop INTEGER DEFAULT NULL,
  ADD COLUMN sugar_per_scoop_g NUMERIC(5,1) DEFAULT NULL,
  ADD COLUMN sodium_per_scoop_mg NUMERIC(6,1) DEFAULT NULL,
  ADD COLUMN label_image_url TEXT DEFAULT NULL;
```

**Rationale:**
- These fields enable the per-scoop/serving/100g nutritional slider. The slider does client-side math: `per_100g = (value / scoop_size_g) * 100`.
- `label_image_url` stores a photo of the product label (supplement facts panel) shown via a modal/button on the product page.
- Existing fields (`caffeine_mg`, `citrulline_g`, `beta_alanine_g`) are already per-scoop values, so they integrate into the same display.

---

## New Components Architecture

### Threaded Comments (`CommentsSection` rewrite)

```
CommentsSection (client component)
  |-- CommentBottomSheet (portal, as before)
  |     |-- CommentThread (top-level comment)
  |     |     |-- CommentBubble (displays single comment with edit/delete/reply actions)
  |     |     |-- ReplyList (collapsed by default, "View N replies")
  |     |     |     |-- CommentBubble (reply)
  |     |-- CommentInput (fixed at bottom, context-aware: reply-to or new comment)
```

**Query pattern:** Fetch top-level comments (`parent_id IS NULL`) with count of replies. Load replies on demand when user taps "View replies". This avoids fetching the full thread tree upfront.

**Edit/Delete flow:**
- Edit: `UPDATE review_comments SET text = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`
- Delete: `UPDATE review_comments SET is_deleted = TRUE, text = '' WHERE id = $1 AND user_id = $2`
- Only the comment author can edit/delete (enforced client-side check + RLS policy).

### Notification System

```
notifications/page.tsx (server component -- refactored)
  |-- Reads from `notifications` table instead of computing from 3 tables
  |-- Joins actor info from `users`, context from `ratings`/`flavors`

NavBar (modified)
  |-- NotificationBadge (client component)
  |     |-- Polls unread count via Supabase realtime OR periodic fetch
  |     |-- Shows red dot / count on bell icon

Notification writers (server actions or Supabase triggers):
  |-- on review_likes INSERT -> INSERT notification (type: 'like')
  |-- on follows INSERT -> INSERT notification (type: 'follow')
  |-- on review_comments INSERT -> INSERT notification (type: 'comment' or 'reply')
```

**Implementation choice:** Use Supabase database triggers (PL/pgSQL functions) rather than dual-inserts in application code. Triggers guarantee notifications are created even if the app code path changes, and they keep the insert atomic.

**Unread badge:** Use Supabase Realtime subscription on the `notifications` table filtered by `user_id` for live updates, falling back to polling every 30s if realtime is not available. A simple `SELECT count(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE` query is fast with the partial index.

### Supplement Calculator

```
SupplementCalculator (client component, new page or settings sub-section)
  |-- Reads user profile (height_cm, weight_kg, goal) from auth context
  |-- Pure client-side calculation, no server round-trips
  |-- Dosage formulas based on body weight + goal:
  |     |-- Protein: ~1.6-2.2g/kg for bulk, 2.0-2.4g/kg for cut
  |     |-- Creatine: 3-5g (flat, not weight-based)
  |     |-- Caffeine: 3-6mg/kg pre-workout
  |     |-- etc.
  |-- Must include disclaimer: "Not medical advice. Consult a healthcare professional."
```

### Nutritional Display (Product Page)

```
NutritionalDisplay (client component)
  |-- Props: scoop_size_g, protein_per_scoop_g, calories_per_scoop, etc.
  |-- Unit toggle slider: "Per Scoop" | "Per Serving" | "Per 100g"
  |-- Client-side math for unit conversion
  |-- Uses existing Slider UI component

ProductPage (server component, modified)
  |-- Hero image (larger, dedicated section)
  |-- "View Label" button -> modal with label_image_url
  |-- NutritionalDisplay component
  |-- Existing flavor list
```

### Swipeable Leaderboard Tabs

```
LeaderboardPage (server component, modified)
  |-- Fetches leaderboard data with dimension scores
  |-- Passes to client component for tab UI

LeaderboardTabs (client component, new)
  |-- Tabs: "Best Overall" | "Best Flavor" | "Best Pump" | "Best Value" | etc.
  |-- Optional: filter by product type category (pre-workout, protein, etc.)
  |-- Swipeable on mobile (touch gesture handler)
  |-- Each tab sorts by different dimension's avg score
```

**Query change:** The `getLeaderboard` function needs to return per-dimension averages, not just `overall_score`. Since scores are JSONB, this requires extracting dimension values:

```sql
-- Approach: fetch all ratings, compute dimension averages in JS
-- (Supabase JS client cannot do JSONB extraction in aggregate queries easily)
-- Continue the existing pattern: fetch raw data, aggregate in Node.js
```

The leaderboard query already fetches up to 2000 ratings and aggregates in JS. Extend this to also extract individual dimension scores from the `scores` JSONB for per-dimension ranking. Filter by category using a `category_id` join through `flavors -> products -> categories`.

---

## Patterns to Follow

### Pattern 1: Server Action for Mutations with Notification Side-Effect

**What:** All write operations (like, comment, follow) use server actions that handle both the primary mutation and notification creation.

**When:** Any user action that should notify another user.

**Example:**
```typescript
// app/actions/comments.ts
'use server'

export async function addComment(ratingId: string, text: string, parentId?: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: comment, error } = await supabase
    .from('review_comments')
    .insert({
      rating_id: ratingId,
      user_id: user.id,
      text: text.trim().slice(0, 280),
      parent_id: parentId ?? null,
    })
    .select('id')
    .single()

  if (error) throw error
  // Notification is handled by DB trigger, not here
  return comment
}
```

### Pattern 2: Schema-Versioned Data Display

**What:** Use `schema_version` to conditionally render rating displays.

**When:** Showing ratings in feed, flavor page, profile page.

**Example:**
```typescript
// In queries: filter out old ratings from public views
.eq('schema_version', 2)  // Only v1.1 ratings

// In display: check version for score dimension labels
const dimensions = rating.schema_version === 2
  ? RATING_DIMENSIONS_V2
  : RATING_DIMENSIONS_V1  // fallback for admin views
```

### Pattern 3: Client-Side Unit Conversion

**What:** Store one canonical unit in DB, convert on the client.

**When:** Nutritional display slider.

**Example:**
```typescript
function convertNutrition(perScoop: number, scoopSizeG: number, mode: 'scoop' | 'serving' | '100g') {
  if (mode === 'scoop') return perScoop
  if (mode === '100g') return (perScoop / scoopSizeG) * 100
  // 'serving' is same as scoop for most supplements
  return perScoop
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Nested Comment Threading Beyond 1 Level

**What:** Allowing replies to replies to create deep trees.

**Why bad:** Renders terribly on mobile. Increases query complexity. Instagram, TikTok, and YouTube all limit to 1 level for good reason.

**Instead:** All replies reference the top-level comment as `parent_id`. Replies appear as a flat list under the parent.

### Anti-Pattern 2: Computing Notifications on Read

**What:** The current approach -- querying `review_likes`, `review_comments`, `follows` on every page load to build the notification list.

**Why bad:** O(n) queries per page load, no read/unread tracking, no badge count, gets slower as data grows.

**Instead:** Write-time notification insertion (DB triggers) + read from `notifications` table.

### Anti-Pattern 3: Migrating Old Rating Data to New Schema

**What:** Running an UPDATE to convert old `scores` JSONB keys from `{taste, sweetness, pump, energy, intensity}` to `{flavor, pump, energy_focus, sweetness, mixability}`.

**Why bad:** Old scores used different dimension semantics. Converting `taste` to `flavor` changes meaning. Old `overall_score` was computed with different weights.

**Instead:** Hide old ratings (`schema_version = 1`) from public views. Keep them in DB for data integrity. Admin can view all versions.

### Anti-Pattern 4: Client-Side Notification Polling Without Throttling

**What:** Polling every 5 seconds for notification count.

**Why bad:** Unnecessary load on Supabase, burns through free tier API limits.

**Instead:** Use Supabase Realtime (websocket subscription on `notifications` table) for instant updates with zero polling. Fall back to 30-60s polling only if realtime fails.

---

## Integration Points -- File-by-File Impact

### Modified Files

| File | Change | Reason |
|------|--------|--------|
| `lib/types.ts` | Add `Notification` type, update `ReviewComment`, `Rating`, `User`, `Product` interfaces, update `Database` type | New columns + table |
| `lib/constants.ts` | New `RATING_DIMENSIONS` (v1.1), keep old as `RATING_DIMENSIONS_V1` | Dimension overhaul |
| `lib/queries.ts` | Add `schema_version = 2` filter to all rating queries, new leaderboard queries per dimension/category, notification queries | Rating migration, leaderboard tabs |
| `components/rating/CommentsSection.tsx` | Full rewrite for threading, edit, delete | Comment threads |
| `components/rating/RatingForm.tsx` | New dimension sliders, price_paid field, schema_version=2 on insert | Rating schema |
| `components/rating/LikeButton.tsx` | No change (notification handled by DB trigger) | -- |
| `components/layout/Navbar.tsx` (or `BottomNav.tsx`) | Add notification badge count | Unread notifications |
| `app/notifications/page.tsx` | Rewrite to read from `notifications` table | Notification system |
| `app/leaderboard/page.tsx` | Refactor for tabbed UI, pass data to client component | Leaderboard tabs |
| `app/products/[slug]/page.tsx` | Add hero image, label button, NutritionalDisplay | Product page upgrade |
| `app/settings/page.tsx` | Add height, weight, goal fields | Calculator profile |
| `app/users/[username]/page.tsx` | Add followers/following list links | Social features |
| `app/actions/feed.ts` | Add `schema_version = 2` filter | Rating migration |
| `context/auth-context.tsx` | Include new user fields in profile type | Calculator needs profile data |

### New Files

| File | Purpose |
|------|---------|
| `components/product/NutritionalDisplay.tsx` | Per-scoop/serving/100g slider |
| `components/product/LabelModal.tsx` | Product label image modal |
| `components/leaderboard/LeaderboardTabs.tsx` | Swipeable dimension/category tabs |
| `components/calculator/SupplementCalculator.tsx` | Client-side dosage calculator |
| `app/calculator/page.tsx` | Calculator page (or section in settings) |
| `app/actions/comments.ts` | Server actions for comment CRUD |
| `app/actions/notifications.ts` | Server actions for marking notifications read |

---

## Suggested Build Order (Dependency-Aware)

### Phase 1: DB Schema + Rating Overhaul
**Build:** Rating schema migration, new dimensions, price_paid, schema_version filtering

**Why first:** Every other feature depends on the new rating system. The leaderboard tabs need dimension scores. The feed needs `schema_version` filtering. This is the foundation.

**Changes:**
1. SQL migration: `ALTER TABLE ratings ADD COLUMN price_paid, schema_version`
2. Update `constants.ts` with new `RATING_DIMENSIONS`
3. Update `RatingForm.tsx` for new dimensions + price_paid input
4. Update `queries.ts` to filter by `schema_version = 2`
5. Update `types.ts` with new Rating fields
6. Update feed action to filter by schema_version

**Risk:** Rating form is the most user-facing change. Test thoroughly.

### Phase 2: Comment Threads + Edit/Delete
**Build:** `review_comments` schema change, CommentsSection rewrite

**Why second:** Independent of other features. The notification system (Phase 3) needs comment infrastructure to be stable before wiring up notification triggers.

**Changes:**
1. SQL migration: `ALTER TABLE review_comments ADD COLUMN parent_id, updated_at, is_deleted`
2. Create `app/actions/comments.ts` server actions
3. Rewrite `CommentsSection.tsx` with threading, edit, delete
4. Update `types.ts` with new ReviewComment fields

### Phase 3: Notification System
**Build:** `notifications` table, DB triggers, refactored notifications page, nav badge

**Why third:** Depends on comment infrastructure (Phase 2) being stable. Also references ratings and follows which are already in place.

**Changes:**
1. SQL migration: `CREATE TABLE notifications`
2. Create DB triggers on `review_likes`, `follows`, `review_comments`
3. Rewrite `notifications/page.tsx` to read from notifications table
4. Create `app/actions/notifications.ts` for mark-as-read
5. Add notification badge to `BottomNav.tsx` or `Navbar.tsx`
6. Add Supabase Realtime subscription for live badge count

### Phase 4: User Profile Fields + Supplement Calculator
**Build:** User table extension, settings form update, calculator component

**Why fourth:** Fully independent of Phases 1-3. Can be built in parallel with Phase 3 if resources allow. Placed here because it is lower priority than core social features.

**Changes:**
1. SQL migration: `ALTER TABLE users ADD COLUMN height_cm, weight_kg, goal`
2. Update `settings/page.tsx` with new fields
3. Create `SupplementCalculator.tsx` component
4. Create `app/calculator/page.tsx` (or integrate into settings/profile)
5. Update `types.ts`, `auth-context.tsx`

### Phase 5: Product Page Upgrade + Nutritional Display
**Build:** Product table extension, hero image, label button, nutritional slider

**Why fifth:** Independent of social features. Product data entry (admin) may need time to populate nutritional values for existing products.

**Changes:**
1. SQL migration: `ALTER TABLE products ADD COLUMN scoop_size_g, protein_per_scoop_g, etc.`
2. Create `NutritionalDisplay.tsx` with unit toggle slider
3. Create `LabelModal.tsx` for label image
4. Update `products/[slug]/page.tsx` with hero image, label button, nutritional display
5. Update admin product management for new fields
6. Update `types.ts`

### Phase 6: Swipeable Leaderboard Tabs
**Build:** Leaderboard refactor with dimension/category tabs

**Why last:** Depends on Phase 1 (new rating dimensions must be live and have data) to be meaningful. Also benefits from Phase 5 category awareness.

**Changes:**
1. Refactor `getLeaderboard` in `queries.ts` to support per-dimension ranking and category filtering
2. Create `LeaderboardTabs.tsx` client component with swipe gestures
3. Update `leaderboard/page.tsx` to use new component
4. Add category filter UI

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Notification count query | Fine with index | Fine with partial index | Consider Redis counter cache |
| Leaderboard computation | JS aggregation fine | Still fine (2000 row limit) | Materialized view required |
| Comment thread loading | Single query | Add pagination (20 top-level) | Cursor-based pagination |
| Rating dimension averages | Compute on read | Compute on read | Pre-computed aggregates table |
| Notification writes (triggers) | Negligible overhead | Fine | Consider async queue (pg_notify -> worker) |

## Sources

- Direct codebase analysis (all findings are HIGH confidence -- based on actual source code)
- Supabase documentation for Realtime subscriptions and DB triggers (HIGH confidence, well-established features)
- Instagram/TikTok comment UX patterns for single-depth threading decision (MEDIUM confidence, UX convention not technical constraint)
