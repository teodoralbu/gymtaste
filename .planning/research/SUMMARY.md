# Project Research Summary

**Project:** GymTaste v1.1 Feature Expansion
**Domain:** Gym supplement review platform (social + product review hybrid)
**Researched:** 2026-03-21
**Confidence:** MEDIUM-HIGH (stack and architecture from direct codebase analysis; features and pitfalls from established patterns)

## Executive Summary

GymTaste v1.1 is a feature expansion of an existing Next.js 16 + Supabase supplement review platform that already has a working social layer (ratings, comments, follows, likes, notifications). The research confirms this is a hybrid product — part social network, part reference tool — and that approach should guide every prioritization decision. The most important finding is that all six planned features are buildable with zero new npm dependencies. The existing stack (Next.js App Router, Supabase PostgREST, TypeScript, CSS custom properties) is fully capable, and the primary work is database schema evolution and React component rewrites rather than new technology integration.

The recommended build sequence is driven by data dependencies, not feature desirability. The rating system overhaul must come first because every other feature — leaderboard category tabs, value score, multi-dimension display — depends on the new `schema_version = 2` ratings being live. Comments and notifications follow in a stable dependency chain. The dosage calculator and product page upgrade are independent and can slot in after the social core is stable. This ordering is not arbitrary; the architecture research identified at least six separate queries in `queries.ts` that read from `ratings`, and all of them need the `schema_version` filter before any other feature work is safe.

The dominant risks are a rating schema migration that breaks existing feed/leaderboard queries if the version filter is applied inconsistently, N+1 comment queries if threading is naively implemented, and legal exposure from the dosage calculator if it outputs personalized dose recommendations without proper clamping and disclaimers. All three are well-understood problems with clear prevention strategies documented in PITFALLS.md. The calculator specifically is the highest-liability feature and should ship last, with unit tests (the only feature in the codebase that genuinely requires them given the health safety stakes).

## Key Findings

### Recommended Stack

The stack requires no new libraries. Every v1.1 feature is implemented with the existing five production dependencies: `@supabase/supabase-js 2.99.1`, `@supabase/ssr 0.9.0`, `next 16.1.6`, `react 19.2.3`, and TypeScript 5. CSS `scroll-snap` (native browser API) handles swipeable tabs. Native `<input type="range">` handles the nutritional slider. PostgreSQL triggers handle notification fan-out atomically. A new materialized view (`leaderboard_stats`) replaces the current 2000-row JS aggregation stopgap.

**Core technologies:**
- `@supabase/supabase-js 2.99.1`: All DB operations, RLS enforcement, trigger-driven notifications — already installed, no upgrade needed
- `Next.js 16.1.6 App Router`: Server components for data-heavy pages, route handlers for the notification count polling endpoint, ISR for leaderboard caching
- `React 19.2.3`: Client components scoped to interactive leaf nodes (slider, tab switcher, edit/delete UI) — keep `'use client'` boundaries at the leaves
- `PostgreSQL triggers`: Atomic notification creation on like/comment/follow insert — more reliable than application-layer dual-writes
- `CSS scroll-snap`: Native swipeable tab implementation with zero JS weight — `scroll-snap-type: x mandatory` + `scroll-snap-align: start`

**What NOT to use:** Supabase Realtime for notifications (WebSocket complexity, free tier connection limits, polling is sufficient), Swiper.js or react-swipeable (50KB for what CSS does natively), any external nutrition API (static ISSN reference data, no runtime dependency needed), react-query/SWR (architectural inconsistency — app is server-component-first).

### Expected Features

Research identifies a clear P1/P2 split. P1 features are table stakes or foundation-blockers. P2 features depend on data being populated (price, nutritional values) or on P1 infrastructure being stable.

**Must have (table stakes / v1.1 P1):**
- Rating system overhaul with new dimensions (flavor, pump, energy_focus, sweetness, mixability) and `schema_version` gating — this is the foundation, everything else depends on it
- Comment edit/delete with "edited" marker — every social app has this; absence signals an unfinished product
- Comment threading (one level, Instagram-style) — meaningful engagement upgrade over flat comments
- Notification unread badge + read state — without a badge, users never check the existing notifications page
- Followers/following lists on profiles — table stakes for any social feature set
- Leaderboard category tabs (Best Flavor, Best Pump, Best Value, Best Overall) — requires new dimension data to be meaningful
- Product page hero image upgrade — low effort, image already exists in DB

**Should have (differentiators / v1.1 P2):**
- Value score (overall_score / price_per_serving) — unique metric no competitor offers; gated on price data being populated
- Per-quantity nutritional slider (per scoop / per serving / per 100g) — mirrors how serious lifters think about dosing
- Supplement dosage calculator (personalized by body weight + goal) — highest differentiation, highest liability, needs unit tests and prominent disclaimers
- Nutritional label image viewer — modal with zoomable label photo; gated on label images being uploaded

**Defer (v2+):**
- Push notifications — requires service worker, permission flows; in-app badge is sufficient for v1.1
- AI review summaries — API cost and hallucination risk on health content; aggregate scores tell the story more reliably
- Supplement stacking advice — interaction effects are poorly studied; medical liability

### Architecture Approach

The architecture follows established Next.js App Router patterns: server components for all data-heavy pages, client components scoped to interactive leaves, server actions for mutations, and `lib/queries.ts` as the central data access layer. The v1.1 changes introduce one new table (`notifications`), modify four existing tables (`review_comments`, `ratings`, `users`, `products`), add three PostgreSQL triggers, one materialized view, and two new RLS policies. The notification system transitions from read-time fan-out (current: rebuild notifications from three tables on every page load) to write-time fan-out (new: DB triggers insert into `notifications` table atomically on each event).

**Major components:**
1. `notifications` table + DB triggers — replaces on-the-fly notification assembly; enables unread badge count via partial index on `(user_id, is_read) WHERE is_read = false`
2. `review_comments` (modified) — adds `parent_id`, `updated_at`, `is_deleted` for threading and soft-delete; two-query fetch pattern (top-level then replies) avoids N+1
3. `ratings` (modified) — adds `schema_version` and `price_paid`; JSONB `scores` field absorbs new dimension keys with no schema migration; `leaderboard_stats` materialized view pre-aggregates dimension averages
4. `LeaderboardTabs` (new client component) — receives all dimension-sorted data pre-loaded from server; tab switching is client-side visibility toggle only, zero additional API calls
5. `SupplementCalculator` (new client component) — pure client-side arithmetic using ISSN reference data; must include server-side output clamping and non-dismissable disclaimer

**Key patterns:**
- Schema-versioned data display: `schema_version = 2` filter on all public rating queries; old ratings retained for data integrity but hidden from feed/leaderboard/profile
- Soft-delete for comments: `is_deleted = true` preserves thread coherence (shows "[deleted]" placeholder) rather than cascade-deleting parent comments and orphaning replies
- ISR + pre-loaded tabs: `revalidate = 300` on leaderboard page with all tab data fetched once server-side; zero client API calls on tab switch

### Critical Pitfalls

1. **Rating schema migration breaks existing queries inconsistently** — add `schema_version` column (default 1), create `CURRENT_SCHEMA_VERSION` constant, audit all six+ locations in `queries.ts` that read from `ratings` and apply the filter everywhere. Warning sign: NaN dimension labels or leaderboard scores that look wrong after migration.

2. **Threaded comments N+1 query explosion** — use fixed one-level depth (replies only to top-level comments, never to replies), fetch in exactly two queries (top-level then batch-fetch replies by `parent_id IN (...)`), add partial index on `review_comments(parent_id) WHERE parent_id IS NOT NULL`.

3. **Missing RLS on new tables** — every migration file must include `ENABLE ROW LEVEL SECURITY` and at least one policy before shipping. Test with anon key, not service role. Critical targets: `notifications` (owner SELECT/UPDATE only), `review_comments` UPDATE policy (required for edit feature — currently missing), user body data (owner-only).

4. **Dosage calculator liability exposure** — frame outputs as "common dosing ranges" not "your recommended dose," cite ISSN sources in the UI, add non-dismissable disclaimer, implement server-side output clamping (e.g., caffeine hard cap at 400mg), add unit tests for every calculation function. This is the only feature in the codebase that genuinely requires tests given the health safety stakes.

5. **Leaderboard re-querying on every tab swipe** — fetch all tab data in a single ISR-cached server-side query, sort client-side on tab switch. Never trigger API calls from the tab component. The current leaderboard query is already the most expensive in the codebase (2000-row scan); multiplying by 4 tabs as separate fetches would be immediately visible as slowness.

## Implications for Roadmap

Based on combined research, the dependency graph from FEATURES.md and ARCHITECTURE.md strongly suggests a six-phase structure. The ordering is not arbitrary — it reflects actual data dependencies and risk sequencing.

### Phase 1: Rating System Overhaul

**Rationale:** Everything else depends on this. Leaderboard tabs need per-dimension scores. Value score needs `price_paid`. Feed needs `schema_version` filtering. Shipping anything else first against a mixed-schema rating table creates compounding cleanup work.

**Delivers:** New rating form with updated dimensions (flavor, pump, energy_focus, sweetness, mixability), `schema_version = 2` gating on all public queries, `price_paid` field on ratings, updated `RATING_DIMENSIONS` constant, updated `types.ts`.

**Addresses:** Rating system overhaul (P1 FEATURES.md), multi-dimension display on feed cards.

**Avoids:** Pitfall 1 (schema migration breaks queries) — address all six `ratings` consumers in `queries.ts` simultaneously.

**Research flag:** Standard patterns — no deeper research needed. Schema migration is well-understood; the specific changes are fully specified in STACK.md and ARCHITECTURE.md.

### Phase 2: Comment Threads and Edit/Delete

**Rationale:** Builds on the stable comment table before the notification system wires up comment triggers. Edit/delete is table stakes with low complexity; threading is the logical extension using the same schema change (`parent_id`). Both ship together to avoid two separate migrations on `review_comments`.

**Delivers:** `parent_id`, `updated_at`, `is_deleted` on `review_comments`; full `CommentsSection.tsx` rewrite with edit/delete/reply; two-query fetch pattern; UPDATE RLS policy on comments.

**Addresses:** Comment edit/delete with "edited" marker (P1 FEATURES.md), comment threading one level deep (P1 FEATURES.md).

**Avoids:** Pitfall 2 (N+1 queries), Pitfall 6 (missing RLS UPDATE policy on comments).

**Research flag:** Standard patterns — well-documented. Instagram-style threading is a solved UX problem.

### Phase 3: Notification System

**Rationale:** Depends on comment infrastructure (Phase 2) being stable since comment inserts trigger the `reply` notification type. All three trigger sources (likes, follows, comments) are now stable. This phase unlocks the unread badge, which directly drives return visits to the notifications page.

**Delivers:** `notifications` table with RLS, three DB triggers (on `review_likes`, `follows`, `review_comments` INSERT), refactored `notifications/page.tsx` reading from the new table, notification badge on nav, mark-as-read server action.

**Addresses:** Notification unread badge + read state (P1 FEATURES.md), followers/following list on profiles (leverages existing `follows` table, fits here logically).

**Avoids:** Pitfall 3 (notification fan-out query cost), Pitfall 6 (notifications table needs RLS before shipping).

**Research flag:** Standard patterns — DB triggers and RLS are well-documented Supabase patterns. The notification badge polling vs Realtime decision is made (polling + optional Realtime fallback); no research needed.

### Phase 4: Leaderboard Category Tabs

**Rationale:** Meaningless without Phase 1 live and accumulating v2 ratings with the new dimension scores. Placed here to give the rating overhaul time to collect data before the category tabs launch. The architectural pattern (pre-load all tabs server-side, switch client-side) is fully specified.

**Delivers:** `leaderboard_stats` materialized view replacing the 2000-row JS aggregation, `LeaderboardTabs.tsx` client component with CSS scroll-snap swipe, per-dimension and per-category sorting, ISR-cached leaderboard page with all tab data pre-loaded.

**Addresses:** Leaderboard category tabs (P1 FEATURES.md), leaderboard by product type (LOW complexity differentiator).

**Avoids:** Pitfall 5 (4x query cost on swipe), iOS swipe vs browser back gesture conflict.

**Research flag:** Standard patterns — ISR caching and CSS scroll-snap are well-documented. No additional research needed.

### Phase 5: Product Page Upgrade + Nutritional Slider

**Rationale:** Fully independent of the social feature chain. Placed here because admin data entry (populating `scoop_size_g`, `protein_per_scoop_g`, `label_image_url`) needs to happen before the features are useful. This phase provides a forcing function to populate that data.

**Delivers:** Hero image section on product page, `LabelModal.tsx` for supplement facts panel, `NutritionalDisplay.tsx` with per-scoop/serving/100g slider using native `<input type="range">`, expanded nutritional columns on `products` table, value score badge (once price data is populated).

**Addresses:** Product page hero image (P1 FEATURES.md), per-quantity nutritional slider (P2), nutritional label viewer (P2), value score (P2).

**Avoids:** Pitfall 6 (new columns need type updates and RLS audit).

**Research flag:** Standard patterns — client-side unit conversion and range sliders are trivial. No research needed.

### Phase 6: User Profile Fields + Supplement Calculator

**Rationale:** Highest differentiation, highest liability. Placed last to ensure it gets careful implementation: unit tests for every formula, server-side output clamping, non-dismissable disclaimer, legal review of disclaimer language. Also benefits from having the product page upgrade live (calculator is most useful contextually on the product page).

**Delivers:** `height_cm`, `weight_kg`, `goal` fields on `users` table with owner-only RLS, settings page update, `SupplementCalculator.tsx` with ISSN-sourced dosage ranges, hard output clamps, prominent disclaimer with source citations.

**Addresses:** Supplement dosage calculator (P2, HIGH user value FEATURES.md).

**Avoids:** Pitfall 4 (liability exposure from unvalidated calculator outputs).

**Research flag:** Needs attention during planning — this is the only feature requiring unit tests. Legal review of disclaimer language is recommended before shipping. The dosage formulas themselves are well-researched (ISSN position stands), but the UI framing ("common ranges" vs "your dose") needs deliberate product decisions.

### Phase Ordering Rationale

- Phase 1 first: rating data is the load-bearing dependency for leaderboard, value score, and feed display. Nothing built on mixed-schema data is trustworthy.
- Phase 2 before Phase 3: comment triggers reference `review_comments`; the table must be stable before the trigger is wired.
- Phase 4 after Phase 1: category tabs are only meaningful once new-schema ratings exist and accumulate.
- Phases 5 and 6 are independent of the social chain and could be parallelized with Phases 3-4 if capacity allows.
- Phase 6 last: highest risk, needs most care, benefits from all other infrastructure being in place.

### Research Flags

Phases needing additional research during planning:
- **Phase 6 (Calculator):** Legal/product framing of calculator outputs. How to present "common dosing ranges" vs "your recommended dose" to stay on the right side of health advice liability. Recommend a brief product/legal review before finalizing the UX copy.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1 (Rating overhaul):** Supabase schema migration and `schema_version` gating are routine.
- **Phase 2 (Comment threads):** Parent-child flat threading with two-query fetch is a solved pattern.
- **Phase 3 (Notifications):** DB triggers + RLS is thoroughly documented in Supabase.
- **Phase 4 (Leaderboard tabs):** ISR caching + CSS scroll-snap is standard.
- **Phase 5 (Product page):** Client-side unit conversion and range slider are trivial.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on direct `package.json` and `node_modules` analysis. All library versions confirmed. No external API lookup needed. |
| Features | MEDIUM | Supplement dosing ranges from ISSN position stands (HIGH confidence for the science); UX patterns (comment threading, notification feeds) from training data on Instagram/Reddit/Untappd (MEDIUM — not live-verified against current versions). |
| Architecture | HIGH | Based on direct source code analysis of `queries.ts`, `types.ts`, `constants.ts`, migration files, and all page/component files. Findings are codebase-specific, not generic. |
| Pitfalls | HIGH | Every pitfall is grounded in specific code locations (named files, named functions) found in the codebase. Not hypothetical risk; these are live vulnerabilities in the current implementation. |

**Overall confidence:** HIGH for technical decisions; MEDIUM for UX pattern conventions.

### Gaps to Address

- **Supabase free tier Realtime connection limits:** STACK.md notes this as MEDIUM confidence (training data). Verify current limits before deciding whether to offer Realtime for notification badge or use polling only. Polling is the safe default if limits are unclear.
- **Price data population:** Value score (Phase 5) is gated on `price_per_serving` being populated for products. No admin bulk-entry workflow currently exists. Plan for this during Phase 1 or Phase 5 planning.
- **Label image upload flow:** Phase 5's label viewer feature requires `label_image_url` on products. Supabase Storage bucket configuration and admin upload UX need to be specified during Phase 5 planning.
- **Calculator disclaimer legal language:** The specific wording of the non-dismissable disclaimer should be reviewed before Phase 6 ships. "This is not medical advice" is the baseline; consider whether the platform needs to add age restrictions or contraindication warnings.
- **Badge tier behavior during rating migration:** PITFALLS.md flags that the `update_user_badge_tier()` trigger counts all ratings. A product decision is needed: do pre-v1.1 ratings still count toward badge XP? This should be resolved in Phase 1 planning before the migration runs.

## Sources

### Primary (HIGH confidence)
- `src/lib/queries.ts` — all query patterns, leaderboard implementation, notification fan-out
- `src/lib/types.ts` — complete DB schema types and `Database` generic
- `src/lib/constants.ts` — rating dimensions, badge tiers, score colors
- `supabase/migrations/001_initial_schema.sql`, `002_schema_updates.sql` — authoritative schema state
- `package.json` + `node_modules/@supabase/supabase-js/package.json` — confirmed library versions
- `src/app/notifications/page.tsx` — confirmed read-time fan-out implementation
- `src/components/rating/CommentsSection.tsx` — confirmed flat comment structure

### Secondary (MEDIUM confidence)
- ISSN position stands on caffeine (2021), creatine (2017, 2021), beta-alanine (2015), citrulline — dosing ranges used in calculator spec
- FDA caffeine guidance (400mg/day general recommendation for healthy adults)
- CSS `scroll-snap` browser support data — 98%+ global coverage, well-established since 2020
- Instagram/TikTok/Reddit comment threading UX conventions — one-level reply depth decision

### Tertiary (LOW confidence — validate before relying)
- Supabase Realtime concurrent connection limits on free tier — training data, verify current pricing page before deciding on notification badge implementation
- Competitor feature sets (Labdoor, Examine, Untappd, Vivino) — training data, may have changed since cutoff

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
