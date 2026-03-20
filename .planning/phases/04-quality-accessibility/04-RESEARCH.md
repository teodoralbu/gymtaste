# Phase 4: Quality & Accessibility - Research

**Researched:** 2026-03-20
**Domain:** TypeScript type safety, error handling patterns, WCAG AA accessibility, loading/empty states
**Confidence:** HIGH

## Summary

Phase 4 addresses two distinct domains: code quality (QUAL-01 through QUAL-03) and user experience / accessibility (UX-01 through UX-05). The code quality work is well-scoped -- the `as any` problem stems from Supabase client instances being cast to `any` because the `Database` type already exists in `src/lib/types.ts` but is not being used when the client is immediately reassigned to `const db = supabase as any`. The fix is mechanical: remove the `as any` casts and use the properly-typed client directly with Supabase's `.from()` method, which already has the `Database` generic applied at client creation time.

The accessibility work requires auditing all interactive elements for focus visibility, adding alt text to images, verifying WCAG AA contrast ratios, and creating consistent empty/loading states. The project already has a global `:focus-visible` rule in `globals.css` and a `.skeleton` CSS class, but neither is consistently applied across the app. There are no `loading.tsx` files (Next.js Suspense boundaries) anywhere in the project.

**Primary recommendation:** Split into 3 plans: (1) TypeScript type safety + error handling for critical paths, (2) loading states + empty states across all pages, (3) keyboard focus + alt text + contrast audit.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUAL-01 | Remove `as any` casts in critical paths (queries.ts, auth context, rating form) | Database type exists at `src/lib/types.ts`, both `createClient()` and `createServerSupabaseClient()` already accept `<Database>` generic. The `as any` pattern exists because developers reassign `const db = supabase as any` -- removing this and using the typed client directly resolves all casts in critical paths. See Architecture Patterns section. |
| QUAL-02 | Standardize error handling in data-fetching paths | Current pattern swallows errors (no `.error` check after Supabase calls in queries.ts). Need consistent result pattern with error propagation. |
| QUAL-03 | File upload validation on avatar upload | Already implemented in `AvatarUpload.tsx` (MIME check for jpeg/png/webp, 5MB size limit). Verify completeness -- current implementation looks correct from Phase 2 work. |
| UX-01 | All interactive elements have visible focus states | Global `:focus-visible` rule exists in `globals.css` but some components use inline styles that may override or lack outline. Custom interactive elements (cards, avatar upload div) need explicit focus handling. |
| UX-02 | Images have alt text; decorative images marked | Only 33 total `alt=` or `aria-label` occurrences across 20 files. Many images likely missing alt text. Need systematic audit of all `<img>`, `<NextImage>`, and decorative SVGs. |
| UX-03 | Color contrast meets WCAG AA in both themes | Dark theme uses `--text-muted: #8B9BB4` on `--bg: #0D0F14` (needs verification). Light theme uses `--text-muted: #4A5060` on `--bg: #F2F3F5`. `--text-dim` colors in both themes are the highest risk for failing AA. |
| UX-04 | Empty states handled gracefully | Some pages have basic "No ratings yet" text but no consistent empty state pattern. Feed, search, browse, leaderboard, and user profile pages all need review. |
| UX-05 | Loading states shown while data fetches | No `loading.tsx` files exist anywhere. No `<Suspense>` boundaries except in login page. Server components render blank until complete. Client components (FeedList, CommentsSection) have some loading spinners but inconsistent patterns. |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router with `loading.tsx` convention | Built-in Suspense integration for streaming |
| @supabase/supabase-js | ^2.99.1 | Typed database client via `Database` generic | Already parameterized at client creation |
| @supabase/ssr | ^0.9.0 | Server/browser Supabase clients | Both already typed with `<Database>` |
| tailwindcss | ^4 | Utility classes including `focus-visible:` | Standard for accessibility utilities |
| typescript | ^5 | Strict mode already enabled | `strict: true` in tsconfig.json |

### Supporting (no new dependencies needed)
This phase requires NO new packages. All work uses existing Next.js conventions, CSS custom properties, and the Supabase typed client.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual contrast checking | axe-core / @axe-core/react | Adds dev dependency, overkill for a one-time audit of known CSS vars |
| Manual focus styles | @headlessui/react | Adds complexity, project uses vanilla HTML elements -- CSS `:focus-visible` sufficient |
| Custom loading skeletons | react-loading-skeleton | Adds dependency, project already has `.skeleton` CSS class |

**Installation:** No new packages needed.

## Architecture Patterns

### Pattern 1: Removing `as any` from Supabase Queries

**What:** The `Database` type is already defined and both `createClient()` and `createServerSupabaseClient()` already accept it as a generic parameter. The problem is that every query function immediately casts the client: `const db = supabase as any`. The fix is to stop doing this and use the typed client directly.

**Current (broken) pattern:**
```typescript
export async function getProductBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()
  const db = supabase as any  // <-- THIS IS THE PROBLEM

  const { data: product } = await db
    .from('products')
    .select('*, brands(*)')
    // ... no type inference, everything is `any`
}
```

**Fixed pattern:**
```typescript
export async function getProductBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()
  // Use supabase directly -- it's already typed with Database generic

  const { data: product } = await supabase
    .from('products')
    .select('*, brands(*)')
    // ... now TypeScript infers types from Database definition
}
```

**Critical detail:** After removing `as any`, the Supabase select queries with joins (e.g., `select('*, brands(*)')`) return nested types that need to be handled differently. The `Database` type in `types.ts` defines `Tables` but NOT the join shapes. Supabase's TypeScript SDK infers join types from the select string, but only when the Database type accurately reflects the foreign key relationships.

**Risk:** The manual `Database` type in `types.ts` may not include all foreign key metadata that Supabase needs for join inference. If join types don't resolve correctly, you may need to define explicit return types or use `.returns<T>()` on queries.

**Affected files in critical paths (QUAL-01 scope):**
- `src/lib/queries.ts` -- 7 functions, all use `const db = supabase as any`
- `src/context/auth-context.tsx` -- 1 instance of `const db = supabase as any`
- `src/components/rating/RatingForm.tsx` -- 1 instance in `handleSubmit`
- `src/app/rate/[slug]/page.tsx` -- 1 instance
- `src/components/rating/CommentsSection.tsx` -- 1 instance
- `src/components/rating/LikeButton.tsx` -- 1 instance

**NOT in scope (v2):** `src/app/browse/page.tsx`, `src/app/page.tsx`, `src/app/rate/page.tsx`, `src/app/rate/[slug]/success/page.tsx`

### Pattern 2: Consistent Error Handling (QUAL-02)

**Current (broken) pattern in queries.ts:**
```typescript
const { data: ratings } = await db.from('ratings').select(...)
// error is destructured but never checked -- silently returns undefined
if (!ratings || ratings.length === 0) return []
```

**Recommended pattern -- result wrapper:**
```typescript
// Keep it simple: check .error on every Supabase call, throw or return null
const { data: ratings, error } = await supabase.from('ratings').select(...)
if (error) {
  console.error('[getLeaderboard] ratings query failed:', error.message)
  return []  // or throw, depending on the function contract
}
```

Do NOT introduce a complex Result type or wrapper -- this is a pre-launch polish milestone. Simply add `.error` checks and `console.error` logging to every Supabase call in `queries.ts`. Functions that return `null` on "not found" (like `getProductBySlug`, `getFlavorBySlug`) should continue returning `null` on error. Functions that return arrays should return `[]` on error.

### Pattern 3: Loading States with Next.js `loading.tsx`

**What:** Next.js App Router supports `loading.tsx` files that automatically wrap the page in a `<Suspense>` boundary. While the page's server component fetches data, `loading.tsx` is shown.

**Where to add (routes that fetch data):**
- `src/app/loading.tsx` -- home page (feed + leaderboard + stats)
- `src/app/flavors/[slug]/loading.tsx` -- flavor detail page
- `src/app/products/[slug]/loading.tsx` -- product detail page
- `src/app/browse/loading.tsx` -- browse page
- `src/app/leaderboard/loading.tsx` -- leaderboard page
- `src/app/users/[username]/loading.tsx` -- user profile page
- `src/app/search/loading.tsx` -- search results page

**Skeleton pattern using existing `.skeleton` class:**
```typescript
export default function Loading() {
  return (
    <div style={{ padding: '20px 16px' }}>
      <div className="skeleton" style={{ height: 24, width: 180, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 120, width: '100%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 120, width: '100%', marginBottom: 12 }} />
    </div>
  )
}
```

### Pattern 4: Empty States

**Where empty states are needed:**
- Home feed (global tab) -- "No reviews yet. Be the first to rate a flavor!"
- Home feed (following tab) -- "Follow people to see their reviews here."
- Search results -- already has "Nothing found" (verify it's styled well)
- User profile ratings tab -- has "No ratings yet." (verify styling)
- Leaderboard -- has "No ratings yet" (verify styling)

**Recommended consistent pattern:**
```typescript
function EmptyState({ icon, title, description, action }: {
  icon: string
  title: string
  description: string
  action?: { label: string; href: string }
}) {
  // Centered box with icon, title, subtitle, optional CTA
}
```

### Pattern 5: Focus Visibility

**What exists:** Global `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` in globals.css. The `Button.tsx` component also has `focus-visible:ring-2 focus-visible:ring-[#00B4FF]`.

**What's missing:**
- Interactive `<div>` elements used as buttons (like AvatarUpload's clickable div) -- these need `tabIndex={0}`, `role="button"`, and `onKeyDown` for Enter/Space
- Card links that use `<div onClick>` instead of `<a>` or `<Link>` -- these need proper semantic elements or ARIA roles
- The `.m-segment-tab` buttons are `<button>` elements (good) but the custom inline-styled buttons across pages may not all be `<button>` elements
- Range sliders need visible focus styling (currently only has `:focus-visible` on the track, not the thumb)

### Anti-Patterns to Avoid
- **Creating a generic ErrorBoundary component:** Overkill for this scope. Just add error checks to existing data-fetching code.
- **Generating Supabase types with CLI:** The manual `Database` type in `types.ts` is sufficient for this milestone. Generated types are a v2 concern (QUAL-05).
- **Adding axe-core or automated a11y testing:** No test infrastructure exists. Manual audit is the right approach for this milestone.
- **Wrapping every component in Suspense:** Use Next.js `loading.tsx` convention for route-level loading states only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Loading skeletons | Custom shimmer animation | Existing `.skeleton` CSS class in globals.css | Already built, consistent with design |
| Focus ring styles | Per-component focus CSS | Global `:focus-visible` rule + `focus-visible:` Tailwind | Already works for all native focusable elements |
| Contrast checking | Manual hex math | WebAIM contrast checker or browser DevTools | Calculating ratios by hand is error-prone |
| Accessible interactive divs | Custom key handlers | Native `<button>` or `<a>` elements | Browsers handle focus, keyboard, screen reader for free |

**Key insight:** Most accessibility improvements come from using correct HTML semantics, not adding ARIA. Replace `<div onClick>` with `<button>` or `<Link>` wherever possible.

## Common Pitfalls

### Pitfall 1: Supabase Join Types Don't Resolve
**What goes wrong:** After removing `as any`, TypeScript complains about join select strings like `select('*, brands(*)')` because the `Database` type doesn't encode foreign key relationships.
**Why it happens:** Supabase's TypeScript SDK infers join types from a `Relationships` array in the Database type. The manual type in `types.ts` doesn't include this.
**How to avoid:** If join types fail, use explicit return type annotations on the query result: `const { data } = await supabase.from('products').select('*, brands(*)') as { data: (Product & { brands: Brand })[] | null, error: ... }`. Or add `.returns<T>()` to the query chain.
**Warning signs:** TypeScript errors like "Property 'brands' does not exist on type..." after removing `as any`.

### Pitfall 2: Focus Styles Override by Inline Styles
**What goes wrong:** The global `:focus-visible` rule sets `outline`, but components with inline `style={{ outline: 'none' }}` or `outline: 0` in their styles override it.
**Why it happens:** Inline styles have higher specificity than stylesheet rules.
**How to avoid:** Search for `outline: 'none'` or `outline: 0` in inline styles. The `.input` class already has `outline: none` but compensates with `border-color` change on focus -- this is fine.
**Warning signs:** Elements that receive focus but show no visual indicator.

### Pitfall 3: Loading States Causing Layout Shift
**What goes wrong:** Skeleton loading states have different dimensions than the actual content, causing a visible jump when data loads.
**Why it happens:** Skeleton heights don't match actual content heights.
**How to avoid:** Match skeleton dimensions to actual content. For feed cards, use the same card container with skeleton blocks inside. For page headers, match the actual header height.
**Warning signs:** Visible content shifting when transitioning from loading to loaded state.

### Pitfall 4: Empty State Not Accounting for Authenticated vs Unauthenticated
**What goes wrong:** Following feed shows "No reviews" when user isn't logged in instead of prompting to log in.
**Why it happens:** Same empty state component used regardless of auth state.
**How to avoid:** Pass auth context to empty states. Following feed should show "Log in to see reviews from people you follow" for unauthenticated users.

### Pitfall 5: QUAL-03 Already Done
**What goes wrong:** Time wasted re-implementing avatar upload validation that was already completed in Phase 2.
**Why it happens:** Not checking existing code before planning.
**How to avoid:** The `AvatarUpload.tsx` already validates MIME type (jpeg/png/webp) and file size (5MB) before upload. This was done in Phase 2 (BUG-06). QUAL-03 should be a verification task, not an implementation task. Confirm the validation exists, test edge cases (0-byte file, exactly 5MB file), and move on.

## Code Examples

### Typed Supabase Query (removing `as any`)
```typescript
// Source: existing src/lib/supabase-server.ts + src/lib/types.ts
import { createServerSupabaseClient } from './supabase-server'

export async function getProductBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()
  // supabase is already SupabaseClient<Database> -- no cast needed

  const { data: product, error } = await supabase
    .from('products')
    .select('*, brands(*)')
    .eq('slug', slug)
    .eq('is_approved', true)
    .single()

  if (error || !product) return null
  // product is now typed as Database['public']['Tables']['products']['Row'] & { brands: ... }
  // If join inference fails, cast the final result instead of the client
  return product
}
```

### Next.js loading.tsx Skeleton
```typescript
// Source: Next.js App Router convention
// src/app/loading.tsx
export default function Loading() {
  return (
    <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }}>
      {/* Hero skeleton */}
      <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 24 }} />
      {/* Stats row skeleton */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton" style={{ height: 64, flex: 1, borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
      {/* Feed card skeletons */}
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton" style={{ height: 140, width: '100%', marginBottom: 12, borderRadius: 'var(--radius-lg)' }} />
      ))}
    </div>
  )
}
```

### Making Interactive Divs Accessible
```typescript
// Before (inaccessible):
<div onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
  {/* avatar content */}
</div>

// After (accessible):
<div
  role="button"
  tabIndex={0}
  onClick={() => fileInputRef.current?.click()}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
  aria-label="Upload avatar photo"
  style={{ cursor: 'pointer' }}
>
  {/* avatar content */}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `:focus` for focus styling | `:focus-visible` | CSS standard, widely supported since 2022 | Only shows focus ring on keyboard navigation, not mouse clicks |
| `outline: none` everywhere | Keep default `:focus-visible` outline | Accessibility standards enforcement | Critical for keyboard users |
| Manual Supabase type casts | `Database` generic on `createClient<Database>()` | @supabase/supabase-js v2+ | Type-safe queries without manual casting |
| Blank screens during load | `loading.tsx` convention in App Router | Next.js 13+ (2023) | Automatic Suspense boundaries per route |

## WCAG AA Contrast Analysis

These are the color combinations that need checking (WCAG AA requires 4.5:1 for normal text, 3:1 for large text):

**Dark theme (highest risk):**
| Foreground | Background | Pair | Risk |
|------------|------------|------|------|
| `--text-dim: #556070` | `--bg: #0D0F14` | Muted labels on page bg | MEDIUM -- likely passes but verify |
| `--text-dim: #556070` | `--bg-card: #161B22` | Muted labels on cards | HIGH RISK -- may fail |
| `--text-faint: #374050` | `--bg: #0D0F14` | Placeholder/disabled text | HIGH RISK -- likely fails |
| `--text-muted: #8B9BB4` | `--bg-card: #161B22` | Secondary text on cards | LOW RISK -- likely passes |

**Light theme (lower risk):**
| Foreground | Background | Pair | Risk |
|------------|------------|------|------|
| `--text-dim: #7A8090` | `--bg-card: #FFFFFF` | Muted labels on cards | MEDIUM -- verify |
| `--text-faint: #B0B8C8` | `--bg: #F2F3F5` | Placeholder text | HIGH RISK -- likely fails |

**Note:** `--text-faint` is used for placeholders and disabled states. WCAG does not require contrast for disabled elements, but placeholder text should still be readable. If `--text-faint` is used for anything other than placeholders/disabled, it needs to pass AA.

## Open Questions

1. **Supabase join type inference**
   - What we know: The `Database` type exists and is passed to client creation. Simple `.from('table').select('*')` queries will be typed correctly.
   - What's unclear: Whether join selects like `select('*, brands(*)')` will infer correctly without `Relationships` metadata in the Database type.
   - Recommendation: Try removing `as any` from one function first (e.g., `getProductsWithFlavors` which has the simplest query). If joins don't resolve, define explicit return types per function rather than generating full Database types.

2. **Scope of alt text audit**
   - What we know: 33 occurrences of alt/aria-label across 20 files. Next/Image requires `alt` prop.
   - What's unclear: How many images are purely decorative vs informational.
   - Recommendation: Audit all `<NextImage>` and `<img>` tags. Product images get descriptive alt text (product name + brand). Avatar images get `alt="{username}'s avatar"`. Decorative SVG icons get `aria-hidden="true"`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None -- no test framework installed |
| Config file | none -- see Wave 0 |
| Quick run command | `npx next build` (type checking) |
| Full suite command | `npx next build` (type checking + build verification) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUAL-01 | No `as any` in critical paths | type-check | `npx tsc --noEmit` | N/A (compiler check) |
| QUAL-02 | Error handling in queries | manual | Inspect code for `.error` checks | N/A |
| QUAL-03 | Avatar upload validates files | manual | Test in browser with invalid file | N/A |
| UX-01 | Focus states on interactive elements | manual | Tab through app in browser | N/A |
| UX-02 | Images have alt text | type-check | `npx tsc --noEmit` (Next/Image enforces alt) | N/A |
| UX-03 | Color contrast WCAG AA | manual | Browser DevTools contrast checker | N/A |
| UX-04 | Empty states displayed | manual | View pages with no data | N/A |
| UX-05 | Loading states shown | manual | Throttle network in DevTools | N/A |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (catches type regressions)
- **Per wave merge:** `npx next build` (full build verification)
- **Phase gate:** Full build green + manual accessibility check

### Wave 0 Gaps
- No test framework exists and none is needed for this phase (tests are out of scope per milestone decisions)
- `npx tsc --noEmit` serves as the automated verification for QUAL-01
- All UX requirements require manual browser verification

## Sources

### Primary (HIGH confidence)
- Project source code: `src/lib/types.ts`, `src/lib/queries.ts`, `src/lib/supabase.ts`, `src/lib/supabase-server.ts`, `src/context/auth-context.tsx`, `src/components/user/AvatarUpload.tsx`, `src/components/rating/RatingForm.tsx`, `src/app/globals.css`
- `tsconfig.json` -- strict mode enabled, confirms type checking rigor
- `package.json` -- verified all dependency versions

### Secondary (MEDIUM confidence)
- WCAG 2.1 AA contrast requirements (4.5:1 normal text, 3:1 large text) -- well-established standard
- Next.js `loading.tsx` convention -- stable since Next.js 13, project uses Next.js 16.1.6

### Tertiary (LOW confidence)
- Supabase TypeScript join inference behavior with manual Database types (needs validation by attempting the fix)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all tools already in project
- Architecture: HIGH for patterns 1-4, MEDIUM for Supabase join type inference
- Pitfalls: HIGH -- identified from direct code inspection
- Accessibility: MEDIUM -- contrast ratios need browser verification, focus audit needs manual testing

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable domain, no fast-moving dependencies)
