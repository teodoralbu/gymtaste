# Phase 3: Performance - Research

**Researched:** 2026-03-19
**Domain:** Next.js 16 performance optimization, Supabase query efficiency, image loading, pagination
**Confidence:** HIGH

## Summary

The GymTaste codebase has several clear performance bottlenecks that are straightforward to identify and fix. The most impactful issue is that multiple query functions in `src/lib/queries.ts` fetch **entire tables** into JavaScript and perform aggregation client-side (leaderboard, top reviewers, browse stats). This is the single biggest scaling risk and the most impactful fix.

The second category of issues is image handling: every image in the app uses raw `<img>` tags (with eslint-disable comments acknowledging this), the `next.config.ts` has no `images` configuration, and no images specify `width`/`height` attributes. This causes layout shift and prevents Next.js image optimization.

The third category is feed pagination: the home feed loads 20-30 items with no way to load more. The feed queries are already reasonably structured (using `Promise.all` for sub-queries), but they need cursor-based pagination for infinite scroll.

**Primary recommendation:** Fix Supabase queries first (biggest impact with smallest code change), then add Next.js Image optimization, then implement infinite scroll on the feed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERF-01 | Main feed load time reduced -- identify and fix bottleneck | Home page runs 4+ parallel data-fetching functions; `getLeaderboard` and `getTopReviewers` do full table scans; `force-dynamic` prevents caching. Fix queries + consider ISR. |
| PERF-02 | Images load efficiently -- lazy loading, correct sizing, no layout shift | All images use raw `<img>` with no width/height; `next.config.ts` missing `images.remotePatterns` for Supabase. Switch to `next/image`. |
| PERF-03 | Page structure clean -- no unnecessary re-renders or layout thrash | Home page is Server Component (good); FeedCard is client component with animation delays; no obvious re-render issues but CLS from unsized images needs fixing. |
| PERF-04 | Supabase queries reviewed -- N+1 removed, indexes added | `getLeaderboard`, `getTopReviewers`, `getProductsWithStats` all fetch entire tables; `getFlavorBySlug` runs 5-6 sequential queries; `getProductBySlug` has 3-query waterfall. |
| PERF-05 | Feed implements pagination or infinite scroll | Home feed hardcoded to `limit(20)` with no cursor/offset; no "load more" UI; needs cursor-based pagination with client-side infinite scroll. |
</phase_requirements>

## Standard Stack

### Core (Already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 (latest: 16.2.0) | Framework with Image optimization, ISR | Already in use, just needs proper config |
| next/image | (built-in) | Image optimization, lazy loading, CLS prevention | Built into Next.js, replaces raw `<img>` tags |
| @supabase/supabase-js | ^2.99.1 | Database queries | Already in use, query patterns need restructuring |

### Supporting (No new dependencies needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React.useCallback / useRef | (built-in) | Intersection Observer for infinite scroll | Detecting scroll position to trigger next page load |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom IntersectionObserver | react-intersection-observer | Adds dependency for ~10 lines of vanilla code -- not worth it |
| Supabase client-side aggregation | Supabase RPC / Postgres functions | RPC is cleaner but requires DB migrations; using `.limit()` + proper selects achieves 90% of benefit |

**No new dependencies needed.** All performance improvements use existing Next.js features and better Supabase query patterns.

## Architecture Patterns

### Pattern 1: Replace Full Table Scans with Bounded Queries

**What:** `getLeaderboard()` and `getTopReviewers()` currently fetch ALL ratings to aggregate in JavaScript. This must be replaced with database-level aggregation or bounded queries.

**Current problem (getLeaderboard):**
```typescript
// BAD: Fetches EVERY rating in the database
const { data: ratings } = await db
  .from('ratings')
  .select('flavor_id, overall_score, would_buy_again')
// Then groups, sorts, slices in JS
```

**Fix approach:** Use Supabase RPC with a Postgres function, OR restructure to use `.limit()` with pre-aggregated data. The simplest approach without DB migrations: use Supabase's built-in aggregation or limit the scan.

**Recommended pattern:**
```typescript
// Option A: Postgres function (best, requires migration)
// CREATE FUNCTION get_leaderboard(lim int) RETURNS TABLE(...)
// const { data } = await db.rpc('get_leaderboard', { lim: 50 })

// Option B: Bounded query (no migration needed)
// Fetch only flavor_ids that have enough ratings, then aggregate per-flavor
const { data: flavorCounts } = await db
  .from('ratings')
  .select('flavor_id')
  // Use Supabase's count by selecting and grouping
```

**Practical recommendation:** Create a Postgres function `get_leaderboard` that does the aggregation server-side. This is the correct long-term fix. For this milestone (no new features, polish only), restructuring the JS queries to limit data transfer is acceptable.

### Pattern 2: Next.js Image Component with Supabase Storage

**What:** Replace all `<img>` tags with `next/image` and configure remote patterns.

**Configuration needed in `next.config.ts`:**
```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}
```

**Image component pattern:**
```tsx
import Image from 'next/image'

// For product images (known aspect ratio):
<Image
  src={product.image_url}
  alt={product.name}
  width={64}
  height={64}
  style={{ objectFit: 'contain' }}
/>

// For avatars:
<Image
  src={user.avatar_url}
  alt=""
  width={32}
  height={32}
  style={{ objectFit: 'cover', borderRadius: '50%' }}
  loading="lazy"
/>

// For review photos (variable aspect ratio):
<Image
  src={rating.photo_url}
  alt="Review photo"
  width={400}
  height={220}
  style={{ objectFit: 'cover', width: '100%', height: 'auto', maxHeight: '220px' }}
  loading="lazy"
/>
```

### Pattern 3: Cursor-Based Infinite Scroll

**What:** Replace the hard-limited feed with cursor-based pagination + IntersectionObserver.

**Server action / API pattern:**
```typescript
// In a server action or API route:
export async function getFeedPage(cursor?: string, limit = 20) {
  let query = db
    .from('ratings')
    .select('id, overall_score, ...')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data } = await query
  const nextCursor = data && data.length === limit
    ? data[data.length - 1].created_at
    : null

  return { items: data ?? [], nextCursor }
}
```

**Client component pattern:**
```tsx
'use client'
import { useRef, useCallback, useEffect, useState } from 'react'

function FeedList({ initialItems, initialCursor }) {
  const [items, setItems] = useState(initialItems)
  const [cursor, setCursor] = useState(initialCursor)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return
    setLoading(true)
    const { items: newItems, nextCursor } = await fetchMoreFeed(cursor)
    setItems(prev => [...prev, ...newItems])
    setCursor(nextCursor)
    setLoading(false)
  }, [cursor, loading])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <>
      {items.map(item => <FeedCard key={item.id} item={item} />)}
      {cursor && <div ref={sentinelRef}>{loading ? 'Loading...' : ''}</div>}
    </>
  )
}
```

### Pattern 4: Reduce Sequential Query Waterfalls

**What:** Several query functions run sequential queries that could be parallelized.

**Example -- `getFlavorBySlug` currently runs:**
1. Fetch flavor (await)
2. Fetch ratings (await)
3. Fetch users by IDs (await)
4. Fetch likes (await)
5. Fetch my likes (await)
6. Fetch siblings (await)

**Better:** After step 1, steps 2 and 6 can run in parallel. After step 2, steps 3, 4, and 5 can run in parallel (they all depend on ratingIds/userIds from step 2).

```typescript
// Step 1: Fetch flavor
const { data: flavor } = await db.from('flavors').select('...').eq('slug', slug).single()

// Step 2: Parallel batch
const [{ data: ratingsRaw }, { data: siblingFlavors }] = await Promise.all([
  db.from('ratings').select('*').eq('flavor_id', flavor.id).order('created_at', { ascending: false }).limit(20),
  db.from('flavors').select('id, name, slug').eq('product_id', flavor.product_id).neq('id', flavor.id).order('name').limit(20),
])

// Step 3: Parallel batch (depends on ratingIds)
const [{ data: users }, { data: likes }, { data: myLikes }] = await Promise.all([
  db.from('users').select('id, username, badge_tier, avatar_url').in('id', userIds),
  db.from('review_likes').select('rating_id').in('rating_id', ratingIds),
  currentUser ? db.from('review_likes').select('rating_id').eq('user_id', currentUser.id).in('rating_id', ratingIds) : Promise.resolve({ data: [] }),
])
```

### Pattern 5: Caching Strategy Adjustment

**What:** The home page uses `force-dynamic` which prevents all caching. Other pages use `revalidate` (good).

**Current state:**
- `page.tsx` (home): `force-dynamic` -- no caching
- `leaderboard/page.tsx`: `revalidate = 300` (5 min)
- `browse/page.tsx`: `revalidate = 120` (2 min)
- `flavors/[slug]/page.tsx`: `revalidate = 60` (1 min)
- `products/[slug]/page.tsx`: `revalidate = 300` (5 min)
- `users/[username]/page.tsx`: `force-dynamic`

**Recommendation:** The home page uses `force-dynamic` because it needs user-specific data (liked status, following feed). This is correct for authenticated users but the global feed portion could benefit from caching. Consider splitting the page: server-render the global feed with ISR and hydrate user-specific data (likes, following tab) client-side.

### Anti-Patterns to Avoid
- **Fetching entire tables for aggregation:** Never `SELECT * FROM ratings` to count or average in JS. Use `{ count: 'exact', head: true }` for counts, Postgres functions for aggregates.
- **Client-side sorting of server data:** If you need top-N, let the database sort and limit.
- **Adding indexes without checking existing ones:** Before adding indexes, verify what Supabase already has (primary keys, foreign keys have implicit indexes).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization | Manual resize/compress pipeline | `next/image` component | Handles responsive sizing, WebP/AVIF conversion, lazy loading, CLS prevention |
| Infinite scroll | Custom scroll event listener | IntersectionObserver API | Scroll events are expensive; IO is performant and well-supported |
| Query aggregation in JS | `Array.reduce()` on full table | Postgres `GROUP BY` / Supabase RPC | JS aggregation transfers all data over the network; DB does it at the storage layer |
| Image layout shift | Manual CSS aspect-ratio hacks | `next/image` width/height props | Next.js reserves space automatically |

## Common Pitfalls

### Pitfall 1: Supabase Image URL Format for next/image
**What goes wrong:** `next/image` rejects URLs that don't match `remotePatterns` in `next.config.ts`
**Why it happens:** Supabase storage URLs vary by project (e.g., `abcdef.supabase.co`)
**How to avoid:** Use wildcard hostname pattern: `*.supabase.co` with correct pathname
**Warning signs:** Build errors or runtime 500s on image routes

### Pitfall 2: Infinite Scroll Memory Leak
**What goes wrong:** IntersectionObserver not disconnected on unmount
**Why it happens:** Missing cleanup in useEffect
**How to avoid:** Always return `() => observer.disconnect()` from useEffect
**Warning signs:** Console warnings about state updates on unmounted components

### Pitfall 3: Cursor Pagination Skipping Items
**What goes wrong:** Items created at the exact same `created_at` timestamp get skipped
**Why it happens:** Using `lt(created_at, cursor)` when multiple items share a timestamp
**How to avoid:** Use compound cursor: `(created_at, id)` -- or use UUID-based `lt('id', lastId)` with consistent ordering
**Warning signs:** Users report missing feed items

### Pitfall 4: next/image with fill + Container Sizing
**What goes wrong:** Image doesn't display or takes up zero space
**Why it happens:** `fill` mode requires the parent to have `position: relative` and explicit dimensions
**How to avoid:** Prefer explicit `width`/`height` over `fill` for known-size images (avatars, product thumbnails)
**Warning signs:** Images invisible or collapsed to 0x0

### Pitfall 5: Breaking Existing revalidate by Adding force-dynamic
**What goes wrong:** Adding a client-side data fetch to a cached page accidentally forces it to dynamic
**Why it happens:** Importing a server action or using `cookies()` in a cached route
**How to avoid:** Keep user-specific data in client components; let the page shell remain static/ISR
**Warning signs:** Pages that were fast suddenly become slow

### Pitfall 6: Supabase .in() with Empty Array
**What goes wrong:** Supabase `.in('id', [])` returns ALL rows instead of none
**Why it happens:** Empty IN clause is treated as no filter
**How to avoid:** Guard all `.in()` calls with `if (ids.length > 0)` -- already done in most places but verify during refactor
**Warning signs:** Unexpected data volume in responses

## Code Examples

### Example 1: next.config.ts with Image Configuration
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
```

### Example 2: Replacing <img> with next/image in FeedCard
```tsx
import Image from 'next/image'

// Avatar (32x32):
<Image
  src={user.avatar_url}
  alt=""
  width={32}
  height={32}
  className="rounded-full object-cover"
/>

// Product thumbnail (52x52):
<Image
  src={product.image_url}
  alt={product.name}
  width={52}
  height={52}
  style={{ objectFit: 'contain', padding: '4px' }}
/>
```

### Example 3: Server Action for Paginated Feed
```typescript
'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function loadMoreFeed(cursor: string, userId?: string) {
  const supabase = await createServerSupabaseClient()
  const db = supabase as any

  const { data: ratings } = await db
    .from('ratings')
    .select('id, overall_score, would_buy_again, review_text, photo_url, created_at, flavor_id, user_id, scores, context_tags')
    .lt('created_at', cursor)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!ratings || ratings.length === 0) return { items: [], nextCursor: null }

  // ... same sub-query pattern as getUnifiedFeed ...

  const nextCursor = ratings.length === 20 ? ratings[ratings.length - 1].created_at : null
  return { items: mapped, nextCursor }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<img>` tags everywhere | `next/image` with automatic optimization | Available since Next.js 10 (2020) | WebP/AVIF, lazy loading, CLS prevention, responsive |
| `force-dynamic` for user data | Partial prerendering (PPR) in Next.js 15+ | Next.js 15 (2024) | Static shell + dynamic holes; experimental in 16 |
| Client-side aggregation | Database-level aggregation (RPC) | Always better, but Supabase RPC matured 2023 | Eliminates network transfer of raw data |
| Offset pagination | Cursor-based pagination | Industry standard since ~2015 | No skipped items, consistent performance at depth |

**Note on PPR:** Next.js 16 supports experimental Partial Prerendering, but it is not stable. For this milestone, using ISR + client-side hydration for user-specific data is the safer approach.

## Open Questions

1. **Supabase Storage URL hostname**
   - What we know: Supabase URLs follow `{project-ref}.supabase.co` pattern
   - What's unclear: The exact project hostname for image remote patterns
   - Recommendation: Check `.env` or `.env.local` for `NEXT_PUBLIC_SUPABASE_URL` and extract the hostname for `next.config.ts`

2. **Existing Supabase indexes**
   - What we know: Primary keys and foreign keys have automatic indexes in Postgres
   - What's unclear: Whether there are custom indexes on `ratings.flavor_id`, `ratings.user_id`, `ratings.created_at`
   - Recommendation: Run `\di` or check Supabase dashboard's Table Editor > Indexes before adding new ones. Key indexes needed: `ratings(created_at DESC)`, `ratings(flavor_id)`, `ratings(user_id)`, `review_likes(rating_id)`, `review_comments(rating_id)`

3. **Database migration access**
   - What we know: Project uses Supabase hosted service
   - What's unclear: Whether the planner can create Supabase migrations (SQL files) or needs to use the dashboard
   - Recommendation: If Supabase CLI is available, use `supabase migration new` for index creation. Otherwise, document SQL and apply via dashboard.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (zero test coverage, accepted for this milestone) |
| Config file | none |
| Quick run command | `npm run build` (type-check + build verification) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-01 | Feed loads faster after query fix | manual | Manual: compare dev server response times before/after | N/A |
| PERF-02 | Images use next/image, no CLS | manual + build | `npm run build` (catches missing remotePatterns) | N/A |
| PERF-03 | No layout thrash | manual | Visual inspection in Chrome DevTools Performance tab | N/A |
| PERF-04 | Queries optimized, no N+1 | manual | Review query count in Supabase dashboard logs | N/A |
| PERF-05 | Feed has pagination/infinite scroll | manual | Scroll to bottom of feed, verify new items load | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` (ensures no type errors from refactoring)
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** Build succeeds + manual verification of all 5 PERF requirements

### Wave 0 Gaps
None -- no test infrastructure in this milestone by design (decision: "Skip test suite -- not blocking launch, deferred to next milestone"). Validation is build-check + manual verification.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `src/lib/queries.ts`, `src/app/page.tsx`, `src/components/feed/FeedCard.tsx`, all page components
- Next.js Image component: built-in to Next.js 16, well-documented API
- Supabase JS client: `.select()`, `.in()`, `.limit()`, `.order()` patterns verified from codebase usage

### Secondary (MEDIUM confidence)
- Next.js `remotePatterns` configuration syntax -- standard since Next.js 13, confirmed in Next.js docs
- IntersectionObserver API -- standard Web API, widely supported
- Cursor-based pagination pattern -- standard industry practice

### Tertiary (LOW confidence)
- Supabase RPC function syntax for leaderboard aggregation -- depends on DB access; may need to fall back to JS-side optimization with tighter bounds
- Exact index recommendations -- without seeing existing Supabase indexes, some may already exist

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, just better use of existing tools
- Architecture: HIGH - patterns are well-established (next/image, cursor pagination, query parallelization)
- Pitfalls: HIGH - identified from direct code analysis, not hypothetical
- Query optimization: MEDIUM - depends on DB access for indexes/RPCs; JS-side improvements are certain

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable patterns, not fast-moving)
