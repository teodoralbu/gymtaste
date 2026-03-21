# Pitfalls Research

**Domain:** Feature expansion for gym supplement review platform (Next.js 16 + Supabase)
**Researched:** 2026-03-21
**Confidence:** HIGH (based on direct codebase analysis + established patterns)

## Critical Pitfalls

### Pitfall 1: Rating Schema Migration Breaks Existing Feed Queries

**What goes wrong:**
The current `scores` JSONB column stores `{"taste": 8, "sweetness": 6, "pump": 7, "energy": 7, "intensity": 7}`. The v1.1 plan changes dimensions (adding "flavor", replacing some keys). Every query that reads `scores` -- `FeedCard.tsx`, `ReviewCard.tsx`, `queries.ts` feed functions, `RatingForm.tsx` -- will break or show wrong data if old ratings with the old key structure are still in the results. The `calcOverall()` function in `RatingForm.tsx` uses `RATING_DIMENSIONS` keys directly, and the leaderboard's `getLeaderboard()` aggregates `overall_score` which was computed with old weights. Mixing old and new `overall_score` values in the same leaderboard makes rankings meaningless.

**Why it happens:**
The decision to "hide old ratings, not delete them" is correct, but developers often implement the hiding filter inconsistently -- adding it to the feed query but forgetting the leaderboard, the user profile rating list, the flavor detail page, or the comment count queries that join on `rating_id`. There are currently at least 6 separate query functions in `queries.ts` that read from the `ratings` table, plus the notifications page which joins on `ratings` to resolve `rating_id` to `flavor_id`.

**How to avoid:**
1. Add a `schema_version` integer column to `ratings` (default 1 for existing, 2 for new). This is cheaper than a boolean flag because future schema changes (v1.2) just increment it.
2. Create a single `CURRENT_SCHEMA_VERSION` constant and a reusable filter: `.eq('schema_version', CURRENT_SCHEMA_VERSION)` -- or better, a database view `ratings_current` that filters automatically.
3. Audit every location that queries `ratings`: `getUnifiedFeed`, `getFollowingUnifiedFeed`, `getFlavorBySlug`, `getLeaderboard`, `getTopReviewers`, `getProductBySlug`, the notifications page, and the `RatingForm` duplicate check.
4. The `update_user_badge_tier` trigger counts ALL ratings for badge calculation. Decide whether hidden old ratings should still count toward badges (they should -- the user did submit them).

**Warning signs:**
- Leaderboard scores look suspiciously different after migration
- FeedCard shows `NaN` or missing dimension labels for some ratings
- Badge tiers drop unexpectedly after migration
- Notification links point to flavor pages that show "no ratings"

**Phase to address:**
Rating system overhaul (should be the FIRST feature phase -- everything else depends on stable ratings)

---

### Pitfall 2: Threaded Comments N+1 Query Explosion

**What goes wrong:**
The current `review_comments` table is flat -- no `parent_id` column, no threading. Adding threading means adding `parent_id UUID REFERENCES review_comments(id)`. The immediate instinct is to recursively fetch children for each comment, creating N+1 queries. With Supabase's client library, there is no native recursive CTE support through the query builder, so developers either (a) fetch all comments and build the tree client-side, or (b) make a recursive API call per nesting level. Both have problems: (a) fetches potentially hundreds of comments when the user only sees 3 top-level ones, and (b) creates waterfall requests.

**Why it happens:**
Supabase PostgREST does not support recursive joins. Developers reach for the easy solution (client-side tree building) without considering the data volume. The current `CommentsSection.tsx` already fetches with `.limit(20)` -- but with threading, 20 top-level comments could have 60+ replies, all needing user data resolution.

**How to avoid:**
1. Use fixed-depth threading (max 1 reply level, like Instagram), not infinite nesting. This is a product decision that massively simplifies the data model. One reply level means `parent_id` is either null (top-level) or points to a top-level comment (never a reply to a reply).
2. Add a CHECK constraint: `CHECK (parent_id IS NULL OR NOT EXISTS (SELECT 1 FROM review_comments rc WHERE rc.id = parent_id AND rc.parent_id IS NOT NULL))` -- or enforce in application code that you can only reply to top-level comments.
3. Fetch in two queries: top-level comments (`.is('parent_id', null).limit(10)`), then replies for those IDs (`.in('parent_id', topLevelIds)`). This is exactly 2 queries regardless of data size.
4. Add an index: `CREATE INDEX idx_review_comments_parent_id ON review_comments(parent_id) WHERE parent_id IS NOT NULL`.

**Warning signs:**
- Comment loading takes >1s for reviews with many comments
- Bottom sheet takes increasingly long to open
- Network tab shows cascading API calls

**Phase to address:**
Comment system upgrade (should come AFTER rating migration, since comments reference ratings)

---

### Pitfall 3: Notification Fan-Out Creates Unbounded Query Cost

**What goes wrong:**
The current notifications page (`src/app/notifications/page.tsx`) is already a read-time fan-out: it queries the user's rating IDs (up to 200), then fetches likes/comments on those ratings, then resolves actors and flavors. This works at small scale but degrades linearly with user activity. A user with 200 ratings who has received 1000 likes will scan 1000 rows in `review_likes` every page load. There is no `notifications` table -- notifications are computed on every page view.

**Why it happens:**
Read-time fan-out is the quickest path to a working notification system. The current implementation proves the UX works. But when adding new notification types (threaded comment replies, follows -- which is already there), the query cost compounds. The `force-dynamic` export means zero caching -- every visit recalculates everything.

**How to avoid:**
1. Create a proper `notifications` table with write-time fan-out: `{id, user_id, type, actor_id, target_id, target_type, read, created_at}`. Insert a notification row when someone likes/comments/follows.
2. Add RLS: `USING (auth.uid() = user_id)` for SELECT, service-role or trigger for INSERT.
3. Use a database trigger or Supabase Edge Function for the insert -- NOT client-side inserts, which are bypassable and create race conditions.
4. Keep the read-time approach as a FALLBACK for the migration period (old activity before the notifications table existed), but mark a cutoff date after which only the table is used.
5. Add a `read` boolean column and query `WHERE read = false` for the unread badge count -- a separate cheap query.

**Warning signs:**
- Notification page load time exceeds 2 seconds
- Supabase dashboard shows high row reads on `review_likes` and `review_comments`
- Users complain about slow notification page (especially active users)

**Phase to address:**
Notification system (should come AFTER comments upgrade, since threaded replies generate new notification types)

---

### Pitfall 4: Supplement Dosage Calculator Liability Exposure

**What goes wrong:**
A dosage calculator that takes height/weight/goal and outputs supplement dosing amounts crosses from "information" into "health advice." If a user follows a suggested creatine dose and has a pre-existing kidney condition, or the formula has a bug that suggests 10x the safe dose, the platform is liable. Even with disclaimers, providing calculated doses based on user-specific body metrics is legally distinct from displaying general information.

**Why it happens:**
Developers treat this as a simple math problem (bodyweight * coefficient = dose). The formulas themselves might be correct, but (a) the source of the formula may not be credible, (b) the formula may not account for contraindications, (c) a bug in the calculation could go unnoticed because there are no tests, and (d) the UI might not distinguish between the calculated value and an actual recommendation.

**How to avoid:**
1. Frame it as "common dosing ranges" not "your recommended dose." Show a range (e.g., "Creatine: 3-5g/day is commonly used") rather than a calculated personal dose.
2. Source every formula from published research or established guidelines (e.g., ISSN position stands). Cite the source directly in the UI.
3. Add a non-dismissable disclaimer that persists in the UI (not just a one-time modal): "This is not medical advice. Consult a healthcare provider before starting any supplement."
4. Implement server-side validation: clamp all outputs to safe maximums. Example: creatine never exceeds 10g/day regardless of bodyweight input.
5. Add input validation: reject unrealistic bodyweights (<30kg or >300kg) and heights that would produce absurd calculations.
6. Given ZERO test coverage in the current codebase, this feature specifically needs unit tests for the calculation functions. A single off-by-10x bug here has real consequences.

**Warning signs:**
- Calculator outputs dosages without citing sources
- No maximum clamp on output values
- Disclaimer only shown once and can be dismissed
- Calculation code has no unit tests

**Phase to address:**
Profile/calculator feature (should be the LAST feature phase -- lowest priority, highest liability risk, needs the most careful implementation)

---

### Pitfall 5: Swipeable Leaderboard Tabs Re-Query on Every Swipe

**What goes wrong:**
The current `getLeaderboard()` fetches 2000 ratings, groups by flavor, and sorts. Adding category tabs (best flavor, best pump, best value, best overall) means either (a) running this expensive query 4 times on page load, or (b) re-running it on every tab swipe. The current leaderboard already has a `revalidate = 300` ISR cache, but if tabs trigger client-side data fetching, each swipe bypasses the cache and hits Supabase directly.

**Why it happens:**
The natural implementation is: each tab is a separate data fetch with a different sort/filter. The leaderboard query is already the most expensive query in the codebase (2000-row scan + aggregation in JS). Multiplying it by 4 tabs is a 4x cost increase.

**How to avoid:**
1. Fetch ALL leaderboard data in a single server-side query and pass all 4 sorted lists to the client as props. The page is ISR-cached (`revalidate = 300`), so this runs once per 5 minutes, not per user.
2. The sorting for "best flavor" vs "best pump" vs "best value" needs the `scores` JSONB data, which the current `getLeaderboard()` does NOT fetch (it only selects `overall_score`). The query must be updated to include `scores` and `price_per_serving` from the product.
3. Client-side tab switching should only toggle visibility of pre-rendered lists, never trigger new API calls.
4. For the swipe gesture: use CSS `scroll-snap` on a horizontal container, not a JS gesture library. This avoids conflicts with vertical scroll and is more performant on mobile. If using a library, ensure `touch-action: pan-y` on the tab content to prevent horizontal swipe from blocking vertical scroll.

**Warning signs:**
- Network tab shows API calls on every tab swipe
- Leaderboard page becomes slow on mobile (multiple concurrent fetches)
- Horizontal swipe conflicts with browser back gesture on iOS

**Phase to address:**
Leaderboard upgrade (can be done in parallel with or after rating migration, but MUST use the new schema's score dimensions)

---

### Pitfall 6: Missing RLS Policies on New Tables

**What goes wrong:**
Every new table (`notifications`, updated `review_comments` with `parent_id`, potentially `user_profiles` for calculator data) needs RLS policies. The current codebase has thorough RLS on all 14 tables. But adding columns (like `parent_id` on `review_comments`) does not require new policies, while adding the `notifications` table does. If the `notifications` table is created without RLS, any authenticated user can read any other user's notifications. If the `updated_at` or `edited_at` column on comments uses an UPDATE policy, the current `review_comments` table has NO update policy -- only select, insert, and delete.

**Why it happens:**
Developers add the table, test it works with the service role key, and forget that the client uses the anon key with RLS. The current codebase pattern is consistent (all tables have RLS enabled + policies), but new tables break the pattern if developers forget.

**How to avoid:**
1. Every migration file must include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and at least one policy.
2. For `notifications`: SELECT only own (`auth.uid() = user_id`), INSERT via trigger/function only (no client inserts).
3. For `review_comments` UPDATE (for edit feature): `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`.
4. For `user_profiles` (calculator body data): SELECT/UPDATE only own. This is sensitive health data -- it must not be publicly readable.
5. Test new tables by querying from the client (anon key), not the service role, during development.

**Warning signs:**
- New features work in development but fail in production (or vice versa, if dev uses service role)
- Users can see other users' notifications or body data
- Comment edit silently fails (no UPDATE policy)

**Phase to address:**
Every phase that adds or modifies tables (cross-cutting concern)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep read-time notification fan-out | No new table, no migration | O(n) query cost per page view scales with user activity | Only during the transition period while building proper notifications table |
| Hardcode rating dimensions in `RATING_DIMENSIONS` constant | Simple, works for single category | Cannot have different dimensions per product category (protein vs pre-workout) | Acceptable for v1.1 if all categories use the same dimensions; revisit when categories diverge |
| Client-side `overall_score` calculation in `RatingForm.tsx` | No server round-trip for live preview | Score can be tampered with; server does not validate the calculation | Acceptable IF a server-side trigger recalculates and overwrites `overall_score` on INSERT |
| No test coverage on dosage calculator | Ship faster | Incorrect formula could suggest unsafe doses | Never acceptable -- this specific feature needs unit tests |
| 2000-row limit on leaderboard query | Avoids full table scan | Leaderboard becomes stale/inaccurate beyond 2000 ratings | Acceptable until ~5000 total ratings; then needs materialized view or DB-side aggregation |
| Flat comment limit (20 per rating) | Simple pagination | With threading, 20 top-level comments could have 100+ replies | Never acceptable once threading is added -- need separate limits for top-level and replies |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase RLS + new columns | Adding `parent_id` to `review_comments` without adding an UPDATE policy for the edit feature | Add UPDATE policy before shipping the edit UI; test with anon key |
| Supabase JSONB `scores` + new keys | Querying old ratings with new dimension keys returns null, breaking averages | Always use `COALESCE` or filter by `schema_version` before aggregating |
| Supabase Realtime for notifications | Subscribing to the `notifications` table on the client without RLS filtering | RLS policies on the table automatically filter Realtime subscriptions -- but only if RLS is enabled and policies exist |
| Next.js ISR + dynamic notification count | Using `revalidate` on a layout that includes a notification badge | Notification badge must use client-side fetch (useEffect + polling or Realtime), not ISR; the rest of the layout can be static |
| Supabase Storage for product label images | Uploading to a public bucket without size limits | Set bucket-level file size limits in Supabase dashboard; validate on client AND server |
| `review_comments` migration + existing `comments` table | Migration 002 references a `comments` table (with `rep_id`); the initial schema has `review_comments` | These appear to be two different tables -- ensure the threading migration targets `review_comments`, not `comments` |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Leaderboard 4x query for category tabs | Page load >3s on mobile, high Supabase row reads | Single server-side fetch, ISR cache, client-side tab switching | Immediately if implemented as per-tab client fetches |
| Notification read-time fan-out with growing user base | Notification page load scales with lifetime activity | Write-time fan-out to dedicated table | ~50 ratings per user (each with likes/comments to scan) |
| Comment tree recursive fetching | Waterfall requests on bottom sheet open | Fixed 1-level depth, 2-query fetch pattern | Any review with >5 threaded replies |
| Badge tier trigger recounting ALL ratings on every insert | `update_user_badge_tier()` does `SELECT COUNT(*) FROM ratings WHERE user_id = NEW.user_id` on every rating insert | Maintain a `rating_count` column on `users` and increment it, or accept the current approach at small scale | ~1000 ratings per user (unlikely near-term) |
| JSONB scores aggregation in JavaScript | `getLeaderboard()` fetches 2000 rows and aggregates in JS instead of SQL | Move to a Postgres function or materialized view for aggregation | ~5000 total ratings |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Dosage calculator outputs without server-side clamping | User modifies client-side code to bypass input validation, gets absurd dose recommendation, screenshots it | All dose calculations should have server-side max clamps; even better, run calculations server-side only |
| Comment edit without ownership check in RLS | Any authenticated user could edit any comment via direct Supabase API call | Add UPDATE policy: `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)` |
| Notification table without SELECT RLS | User A can read User B's notifications by querying directly | `CREATE POLICY ... FOR SELECT USING (auth.uid() = user_id)` |
| User body data (height/weight) in public profile table | Health-related PII exposed to all users | Store in a separate `user_health_profiles` table with strict owner-only RLS, not in the public `users` table |
| Comment edit history leaking deleted content | Edited-away offensive content visible via `edit_history` JSONB if stored | Do not store edit history; only store `edited_at` timestamp. The old text is gone. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Swipe tabs conflicting with iOS back gesture | User tries to swipe between leaderboard tabs but triggers browser back navigation | Use `touch-action: pan-y` on swipeable area; add visible tab indicator dots; support tap-to-switch as primary, swipe as secondary |
| Comment edit replaces text without undo | User accidentally clears their comment while editing | Show inline edit with cancel button; do not auto-save; require explicit "Save edit" tap |
| Notification page has no real-time updates | User leaves notification page open, new notifications don't appear | Add client-side polling (every 30s) or Supabase Realtime subscription; show "New notifications" toast |
| Old ratings disappear without explanation | Users who submitted ratings before v1.1 see them vanish from flavor pages | Show a banner on affected flavor pages: "Ratings from the previous scoring system are archived. Re-rate this flavor with the new system!" |
| Dosage calculator shows results before user finishes input | Partial input (height entered, weight empty) shows NaN or 0g dose | Show results only when all required fields are filled; use a "Calculate" button, not live updates |

## "Looks Done But Isn't" Checklist

- [ ] **Rating migration:** Old ratings hidden from feed -- verify also hidden from leaderboard, user profile, flavor detail, notifications, search results, and sitemap
- [ ] **Rating migration:** `overall_score` recalculated with new weights -- verify the `calcOverall()` in `RatingForm.tsx` AND the `calculateOverallScore()` in `utils.ts` both use the same new weights
- [ ] **Rating migration:** Badge tier trigger still works -- verify `update_user_badge_tier()` counts both old and new schema ratings (or only new, if that is the decision)
- [ ] **Threaded comments:** Edit feature has UPDATE RLS policy -- verify by testing with anon key, not service role
- [ ] **Threaded comments:** "Edited" marker shows on edited comments -- verify `updated_at` is NOT set on initial insert (use `DEFAULT null`, not `DEFAULT now()`)
- [ ] **Threaded comments:** Delete a parent comment -- verify replies are either cascade-deleted or orphaned gracefully (show "[deleted]" placeholder)
- [ ] **Notifications:** Unread count in nav bar -- verify it updates when the user visits the notifications page (mark as read)
- [ ] **Notifications:** Self-notifications filtered -- verify user does not get notified about their own likes/comments/follows
- [ ] **Dosage calculator:** Maximum output clamps tested -- verify creatine never exceeds 10g, caffeine never exceeds 400mg, etc.
- [ ] **Dosage calculator:** Disclaimer visible -- verify it cannot be dismissed and persists alongside results
- [ ] **Leaderboard tabs:** Tab data pre-loaded on server -- verify no client-side API calls on tab switch (check Network tab)
- [ ] **Leaderboard tabs:** Swipe does not break vertical scroll -- verify on real iOS and Android devices, not just desktop

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Old ratings leak into new leaderboard | LOW | Add `schema_version` filter to `getLeaderboard()`; ISR cache clears in 5 min |
| N+1 comment queries in production | MEDIUM | Refactor to 2-query pattern; requires changing data fetching in `CommentsSection.tsx` |
| No RLS on notifications table | HIGH | Add policy immediately; audit for any data that was already exposed; cannot un-expose data already read |
| Dosage calculator formula bug in production | HIGH | Hotfix the formula; add server-side max clamps; audit if any user received dangerous advice; consider temporary feature flag to disable |
| Swipe gesture breaks on iOS | LOW | Add `touch-action: pan-y` CSS; no data migration needed |
| Mixed `overall_score` values in leaderboard (old vs new weights) | MEDIUM | Backfill `overall_score` for new-schema ratings using a migration script; cannot fix old-schema scores (they used different dimensions) |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Rating schema migration breaks queries | Phase 1: Rating System Overhaul | Query every `ratings` consumer with test data containing both schema versions |
| Comment N+1 queries | Phase 2: Comment System Upgrade | Load test with 50+ comments per rating; verify exactly 2 network requests |
| Notification fan-out scaling | Phase 3: Notification System | Measure page load time for a user with 100+ ratings; must be <1s |
| Missing RLS on new tables | Every phase | Test every new table operation with anon key before shipping |
| Dosage calculator liability | Phase 5: Profile/Calculator | Unit test every formula; legal review of disclaimer text; verify max clamps |
| Leaderboard re-query on swipe | Phase 4: Leaderboard Upgrade | Network tab shows 0 API calls on tab switch; test on real mobile devices |
| Old ratings appearing in unexpected places | Phase 1: Rating System Overhaul | grep codebase for `.from('ratings')` and verify every instance has schema_version filter |
| Comment edit without UPDATE policy | Phase 2: Comment System Upgrade | Attempt to update another user's comment via Supabase client; must fail |
| User body data exposure | Phase 5: Profile/Calculator | Query `user_health_profiles` as another authenticated user; must return empty |

## Sources

- Direct codebase analysis: `src/lib/queries.ts`, `src/app/notifications/page.tsx`, `src/components/rating/CommentsSection.tsx`, `src/app/leaderboard/page.tsx`, `src/components/rating/RatingForm.tsx`
- Database schema: `supabase/migrations/001_initial_schema.sql`, `supabase/migrations/002_schema_updates.sql`
- Type definitions: `src/lib/types.ts`, `src/lib/constants.ts`
- Supabase RLS documentation (established patterns from codebase)
- ISSN position stands on supplement dosing (general knowledge, HIGH confidence)
- Instagram threading model (1-level reply depth, established UX pattern)

---
*Pitfalls research for: GymTaste v1.1 Feature Expansion*
*Researched: 2026-03-21*
