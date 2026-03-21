# Phase 6: Bug Fixes & UX Quick Wins - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 5 known bugs and ship the landing page hero image. No new features — this phase resolves issues in username validation, light-theme email visibility, taste tag display consistency, bottom nav cleanliness, and landing page visual impact.

</domain>

<decisions>
## Implementation Decisions

### Landing page hero image (FIX-05)
- A gym supplement product shot (pre-workout or protein tub — generic, brand-agnostic)
- Use a placeholder image for now (user will provide final asset later)
- Image sits **above** the tagline — fills the top of the hero card, text + CTAs below
- Style: **full-width, rounded top corners** matching the existing card border-radius — no padding around image, edge-to-edge

### Claude's Discretion
- FIX-01: Username regex fix — update `/^[a-z0-9_]+$/` to `/^[a-z0-9_.]+$/` in both `src/app/signup/page.tsx` and `src/app/settings/page.tsx`. Also check if Supabase DB has a column constraint that needs updating.
- FIX-02: Email display fix — replace hardcoded `text-white` class on `<span>` in `src/app/signup/page.tsx:48` with a theme-aware color (use `var(--text)` or `var(--accent)`)
- FIX-03: Taste tag consistency — hide the tags section when `flavor.tags` is empty/null (consistent absence is better than showing an empty widget). Apply this consistently across all product cards and flavor pages.
- FIX-04: Remove Browse tab from BottomNav — the 4 remaining tabs (Home, Rate, Top, Profile) should be evenly redistributed. The Browse active state paths (`/products`, `/flavors`, `/brands`) can be left unmatched or redirected. Claude decides the cleanest layout for 4 tabs with the center Rate button.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to modify
- `src/app/signup/page.tsx` — username regex (FIX-01) + email text-white fix (FIX-02)
- `src/app/settings/page.tsx` — username regex (FIX-01)
- `src/components/layout/BottomNav.tsx` — remove Browse tab (FIX-04)
- `src/app/page.tsx` — hero image addition (FIX-05)
- `src/app/products/[slug]/page.tsx` — taste tag display (FIX-03)
- `src/app/flavors/[slug]/page.tsx` — taste tag display (FIX-03)
- `src/components/feed/FeedCard.tsx` — context_tags display (related to FIX-03)

### Project config
- `.planning/REQUIREMENTS.md` — FIX-01 through FIX-05 acceptance criteria

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `var(--bg-card)`, `var(--border)`, `var(--radius-lg)` CSS variables: used on the hero card — hero image must respect these for seamless integration
- Existing card pattern in `src/app/page.tsx` uses inline styles with `borderRadius: 'var(--radius-lg)'` and `overflow: 'hidden'` will be needed to clip the image corners

### Established Patterns
- Username validation: both signup and settings use identical regex `/^[a-z0-9_]+$/` — fix must be applied in both locations
- Theme-aware colors: always use CSS variables (`var(--text)`, `var(--text-dim)`, etc.) — never hardcode `text-white` or similar for text that appears on theme-dependent backgrounds
- Tag display: `flavor.tags && flavor.tags.length > 0 && (...)` pattern already exists — consistent with hiding when absent

### Integration Points
- BottomNav is in `src/components/layout/BottomNav.tsx` — after removing Browse, the `browseActive` state and its path matching can be removed entirely
- Hero card is in `src/app/page.tsx` inside the `{!user && (...)}` block — image goes above the `<h1>` tagline

</code_context>

<specifics>
## Specific Ideas

- Hero image: use a placeholder (styled `<div>` with a background gradient or a royalty-free URL like Unsplash) until the user provides a real asset. Make it easy to swap by using `next/image` with a `src` that can be replaced.
- Hero image dimensions: tall enough to read as a hero but not overwhelming — roughly 200px height on mobile.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-bug-fixes-ux-quick-wins*
*Context gathered: 2026-03-21*
