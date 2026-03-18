# Requirements: GymTaste Pre-Launch Quality Milestone

**Defined:** 2026-03-18
**Core Value:** Users can confidently discover and rate gym supplement flavors through a fast, polished mobile experience

## v1 Requirements

### Mobile UX

- [ ] **MOB-01**: Bottom navigation is accessible, correctly sized (touch targets ≥44px), and highlights the active route
- [ ] **MOB-02**: Feed cards are readable and tappable on small screens without horizontal overflow or clipping
- [ ] **MOB-03**: Rating form (rate/[slug]) is fully usable on mobile — sliders, inputs, and submit button work without awkward layouts
- [ ] **MOB-04**: User profile and settings pages are correctly laid out on mobile — no overflow, avatar upload works on mobile
- [ ] **MOB-05**: Page transitions and navigation feel smooth on mobile (no layout jumps, consistent back behavior)
- [ ] **MOB-06**: All tap targets across the app meet minimum size requirements — no tiny buttons or links

### Bug Hunt & Fixes

- [ ] **BUG-01**: Systematically audit all user-facing flows for broken behavior (auth, rating, feed, profile, comments, likes, follow)
- [ ] **BUG-02**: Fix all broken flows discovered in audit — each bug documented and resolved
- [ ] **BUG-03**: Auth flow works correctly end-to-end on mobile (login, signup, session persistence, logout)
- [ ] **BUG-04**: Rating submission flow completes without errors and shows correct success state
- [ ] **BUG-05**: Comment and like actions work reliably without stale state or UI glitches
- [ ] **BUG-06**: Avatar upload completes successfully and reflects immediately in UI

### Performance

- [ ] **PERF-01**: Main feed (home page) load time reduced — identify and fix the bottleneck (queries, bundle, rendering)
- [ ] **PERF-02**: Product/avatar images load efficiently — lazy loading, correct sizing, no layout shift
- [ ] **PERF-03**: Page structure and layout rendering is clean — no unnecessary re-renders or layout thrash
- [ ] **PERF-04**: Supabase queries in critical paths reviewed and optimized (remove N+1 patterns, add indexes where needed)
- [ ] **PERF-05**: Feed implements basic pagination or infinite scroll — not loading all records at once

### Code Quality

- [ ] **QUAL-01**: `as any` casts in critical paths removed — `src/lib/queries.ts`, auth context, and rating form typed properly
- [ ] **QUAL-02**: Error handling standardized in data-fetching paths — consistent result pattern, no swallowed errors
- [ ] **QUAL-03**: File upload validation added to avatar upload — MIME type and size checked before sending to Supabase

### UX & Accessibility

- [ ] **UX-01**: All interactive elements have visible focus states (keyboard navigation works)
- [ ] **UX-02**: Images have alt text; decorative images are marked appropriately
- [ ] **UX-03**: Color contrast meets WCAG AA in both light and dark themes
- [ ] **UX-04**: Empty states are handled gracefully — no blank pages when feed/results are empty
- [ ] **UX-05**: Loading states are shown while data fetches — no content flash or invisible loading

## v2 Requirements

### Test Coverage

- **TEST-01**: Unit tests for `src/lib/utils.ts` pure functions
- **TEST-02**: Unit tests for `src/lib/queries.ts` query functions
- **TEST-03**: Component tests for RatingForm submission flow
- **TEST-04**: E2E test for core rating flow

### Advanced Performance

- **PERF-06**: Leaderboard uses materialized view instead of full table scan
- **PERF-07**: Sitemap generation cached
- **PERF-08**: Service worker / PWA caching

### Extended Type Safety

- **QUAL-04**: All remaining `as any` casts removed (111+ total)
- **QUAL-05**: Supabase client typed from generated schema

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features | Focus is quality and polish, not scope expansion |
| Test suite setup | Deferred to next milestone |
| Search indexing | Not blocking launch |
| Offline/PWA support | Deferred |
| Real-time features | Not in current app |
| Leaderboard materialized view | v2 — not blocking launch |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MOB-01 | Phase 1 | Pending |
| MOB-02 | Phase 1 | Pending |
| MOB-03 | Phase 1 | Pending |
| MOB-04 | Phase 1 | Pending |
| MOB-05 | Phase 1 | Pending |
| MOB-06 | Phase 1 | Pending |
| BUG-01 | Phase 2 | Pending |
| BUG-02 | Phase 2 | Pending |
| BUG-03 | Phase 2 | Pending |
| BUG-04 | Phase 2 | Pending |
| BUG-05 | Phase 2 | Pending |
| BUG-06 | Phase 2 | Pending |
| PERF-01 | Phase 3 | Pending |
| PERF-02 | Phase 3 | Pending |
| PERF-03 | Phase 3 | Pending |
| PERF-04 | Phase 3 | Pending |
| PERF-05 | Phase 3 | Pending |
| QUAL-01 | Phase 4 | Pending |
| QUAL-02 | Phase 4 | Pending |
| QUAL-03 | Phase 4 | Pending |
| UX-01 | Phase 4 | Pending |
| UX-02 | Phase 4 | Pending |
| UX-03 | Phase 4 | Pending |
| UX-04 | Phase 4 | Pending |
| UX-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after initial definition*
