# Phase 11: Nav Restructure - Research

**Researched:** 2026-03-23
**Domain:** Next.js App Router navigation / bottom nav component
**Confidence:** HIGH

---

## Summary

This is a purely structural navigation change. No new routes are being created and no
content is being modified. The bottom nav has five slots: Home (pos 1), Top (pos 2),
center spacer, Alerts (pos 4), Profile (pos 5), plus a floating Rate FAB. The goal is
to swap the first two visible tabs so that "Home" (currently `href="/"`) is renamed to
"Feed" and moves to position 2, and "Top" (currently `href="/leaderboard"`) is renamed
to "Home" and moves to position 1.

Route URLs do not change. The page at `/` continues to be the feed page; the page at
`/leaderboard` continues to be the leaderboard page. Only the BottomNav component
changes in a meaningful structural way. Two active-state variable names are candidates
for a cosmetic rename inside BottomNav for code clarity, but are not visible to users.

No middleware, no redirects, no new routes, and no database changes are involved.
The middleware (`src/middleware.ts`) is a pure Supabase session-refresh pass-through
with no route-gating logic; it does not need touching.

**Primary recommendation:** Edit `src/components/layout/BottomNav.tsx` only. Swap the
JSX order of the first two `<Link>` blocks, rename the labels ("Home" -> "Feed",
"Top" -> "Home"), and optionally rename the local active-state variables for clarity.
All other files that reference `/leaderboard` or `href="/"` are breadcrumbs, desktop
navbar links, or content cross-links — they are not part of the bottom nav and do not
need to change for this phase.

---

## File Inventory: What Needs to Change

### PRIMARY CHANGE (required)

**`src/components/layout/BottomNav.tsx`**

This is the only file that requires a structural edit. Full breakdown:

| Location | Current State | Required Change |
|----------|--------------|-----------------|
| Line 13 | `const homeActive = pathname === '/'` | Rename variable to `feedActive` (cosmetic clarity) |
| Line 15 | `const topActive  = pathname.startsWith('/leaderboard')` | Rename variable to `homeActive` (cosmetic clarity) |
| Lines 66-74 | Tab 1: `href="/"`, label "Home", house icon, uses `homeActive` | Swap to position 2, rename label to "Feed" |
| Lines 76-85 | Tab 2: `href="/leaderboard"`, label "Top", bar chart icon, uses `topActive` | Swap to position 1, rename label to "Home" |

**Exact current tab order in JSX (lines 66-133):**
1. Lines 66-74: Home (`href="/"`)
2. Lines 76-85: Top (`href="/leaderboard"`)
3. Lines 87-88: Center spacer `<div>` (stays in place)
4. Lines 90-122: Alerts (`href="/notifications"`)
5. Lines 124-132: Profile (`href={profileHref}`)
6. Lines 134-166: Rate FAB (absolute positioned, stays in place)

**Required tab order after change:**
1. Home (`href="/leaderboard"`, label "Home", bar chart icon)
2. Feed (`href="/"`, label "Feed", house icon)
3. Center spacer (unchanged)
4. Alerts (unchanged)
5. Profile (unchanged)
6. Rate FAB (unchanged)

**Active-state detection pattern (currently lines 13-17):**

```typescript
// CURRENT
const homeActive    = pathname === '/'
const rateActive    = pathname.startsWith('/rate')
const topActive     = pathname.startsWith('/leaderboard')
const notifActive   = pathname.startsWith('/notifications')
const profileActive = pathname.startsWith('/users') || pathname.startsWith('/settings') || pathname === '/login' || pathname === '/signup'
```

After rename for clarity:

```typescript
// AFTER (variable names updated to match new semantic meaning)
const feedActive    = pathname === '/'
const rateActive    = pathname.startsWith('/rate')
const homeActive    = pathname.startsWith('/leaderboard')
const notifActive   = pathname.startsWith('/notifications')
const profileActive = pathname.startsWith('/users') || pathname.startsWith('/settings') || pathname === '/login' || pathname === '/signup'
```

The active indicator underline, stroke-width boldness, and color are all driven by
these boolean variables passed into `tabStyle(active)` and `labelStyle(active)`. No
new logic is needed — just swap which boolean goes to which tab.

---

### FILES THAT DO NOT NEED TO CHANGE

These files reference `/leaderboard` or `href="/"` but are NOT part of the bottom
nav and are out of scope for this phase.

| File | Line(s) | What it does | Action |
|------|---------|-------------|--------|
| `src/components/layout/Navbar.tsx` | 30 | Logo links to `/` | No change — logo href is correct |
| `src/components/layout/Navbar.tsx` | 46 | Desktop nav: "Top Rated" → `/leaderboard` | No change — desktop nav is not in scope |
| `src/components/layout/Navbar.tsx` | 93 | User dropdown: "Leaderboard" → `/leaderboard` | No change — dropdown is not in scope |
| `src/components/layout/Footer.tsx` | 75 | Footer Explore group: "Leaderboard" → `/leaderboard` | No change — footer is not in scope |
| `src/app/page.tsx` | 153, 190, 437, 513 | Multiple `href="/leaderboard"` content links | No change — page content, not nav |
| `src/app/brands/[slug]/page.tsx` | 102 | Breadcrumb: "Home" → `/` | No change — breadcrumb, not nav tab |
| `src/app/products/[slug]/page.tsx` | 59 | Breadcrumb: "Home" → `/` | No change — breadcrumb, not nav tab |
| `src/app/sitemap.ts` | 20 | Sitemap entry for `/leaderboard` | No change — route URL unchanged |
| `src/middleware.ts` | — | Session refresh only, no routing logic | No change |
| `next.config.ts` | — | No redirects defined | No change |

---

## Architecture Patterns

### Active State Detection

`usePathname()` from `next/navigation` is the single source of truth. The component
is already a `'use client'` component. Pattern is:

```typescript
const feedActive  = pathname === '/'               // exact match
const homeActive  = pathname.startsWith('/leaderboard')  // prefix match
```

Exact match (`===`) is used for the root route to avoid false positives.
Prefix match (`startsWith`) is used for all other tabs to cover sub-routes.

### Tab Rendering Pattern

Each tab is a `<Link>` element using inline style objects from helper functions:

```typescript
tabStyle(active: boolean)   // controls color, layout, sizing
labelStyle(active: boolean) // controls font-weight and size
```

Active indicator is an absolutely-positioned 2px accent line rendered conditionally:

```typescript
{active && <span style={{ position: 'absolute', top: '6px', ... }} />}
```

All three pieces (link style, label style, indicator span) reference the same boolean.
Swapping tab positions is a matter of reordering the JSX blocks and updating which
boolean each block receives.

### Icon Choice

The two icons in scope:

- **House icon** (currently on "Home" tab, will move to "Feed" tab):
  `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />` +
  `<polyline points="9 22 9 12 15 12 15 22" />`

- **Bar chart icon** (currently on "Top" tab, will move to "Home" tab):
  Three `<polyline>` bars at x=18, x=12, x=6

Icons travel with their tabs. No icon changes needed — each icon stays paired with
its route.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Active state detection | Custom route-matching utility | `usePathname()` already in use — keep it |
| Tab order management | Tab registry or config array | Plain JSX order in the component |

---

## Common Pitfalls

### Pitfall 1: Forgetting to update the active-state variable references in the JSX
**What goes wrong:** Renaming the variables but leaving old names in JSX — TypeScript
will catch undefined references, but only at compile time.
**How to avoid:** After renaming `homeActive` -> `feedActive` and `topActive` ->
`homeActive`, do a file-scoped search for both old names before saving.

### Pitfall 2: Moving the JSX blocks but not the variable name bindings
**What goes wrong:** The visual tab order changes but the active state still fires on
the wrong tab. E.g., the "Home" tab highlights when on `/` instead of `/leaderboard`.
**How to avoid:** Verify that after the edit, the `homeActive` variable uses
`pathname.startsWith('/leaderboard')` and the `feedActive` variable uses
`pathname === '/'`.

### Pitfall 3: Accidentally moving the center spacer div
**What goes wrong:** The center spacer (`<div style={{ flex: 1 }} aria-hidden="true" />`)
exists to push the first two tabs left and the last two tabs right, creating space for
the floating Rate FAB. Moving it breaks the layout.
**How to avoid:** The spacer must remain at position 3 (between Feed and Alerts).
Only reorder the first two `<Link>` elements.

### Pitfall 4: Confusing breadcrumb "Home" labels with nav tab labels
**What goes wrong:** Searching for "Home" in the codebase finds breadcrumb links in
`brands/[slug]/page.tsx` and `products/[slug]/page.tsx`. These are separate UI
elements — changing them would be content scope creep.
**How to avoid:** Only touch `BottomNav.tsx`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files found in project |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Manual Verification Steps

Because there is no automated test suite, verification is manual:

1. `npm run dev` — confirm the dev server starts without TypeScript errors.
2. Open the app on a mobile viewport (or DevTools mobile emulation).
3. Verify tab order left-to-right: Home | Feed | [FAB] | Alerts | Profile.
4. Navigate to `/` — confirm "Feed" tab highlights, "Home" tab does not.
5. Navigate to `/leaderboard` — confirm "Home" tab highlights, "Feed" tab does not.
6. Navigate to `/rate` — confirm FAB area reflects active state, other tabs inactive.
7. Navigate to `/notifications` — confirm "Alerts" tab highlights.
8. Check desktop view — desktop Navbar should be unchanged.
9. `npm run build` — confirm no TypeScript or build errors.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is a code-only change to a single component. No
external services, databases, or CLI tools beyond the Next.js dev server are required.

---

## Runtime State Inventory

Step 2.5: SKIPPED — this is not a rename/refactor/migration phase. No stored data,
service config, OS state, secrets, or build artifacts reference nav tab labels.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `src/components/layout/BottomNav.tsx` (full file read)
- Direct codebase inspection of `src/app/layout.tsx` (full file read)
- Direct codebase inspection of `src/components/layout/Navbar.tsx` (full file read)
- Direct codebase inspection of `src/middleware.ts` (full file read)
- Direct codebase inspection of `next.config.ts` (full file read)
- `grep` sweep: all occurrences of `homeActive`, `topActive`, `href="/"`, `leaderboard` across `src/`

### Secondary
- N/A — this phase requires no library research, only codebase mapping.

---

## Metadata

**Confidence breakdown:**
- File inventory: HIGH — every relevant file was directly read and grepped
- Change scope: HIGH — only BottomNav.tsx requires edits
- Active state logic: HIGH — pattern is explicit in the source code
- Side-effects: HIGH — middleware has no route logic; next.config.ts has no redirects

**Research date:** 2026-03-23
**Valid until:** Indefinite — findings are based on current codebase state, not external library versions
