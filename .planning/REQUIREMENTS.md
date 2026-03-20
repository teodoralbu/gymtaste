# Requirements: GymTaste Pre-Launch Quality Milestone

**Defined:** 2026-03-18
**Core Value:** Users can confidently discover and rate gym supplement flavors through a fast, polished mobile experience

## v1 Requirements

### Mobile UX

- [x] **MOB-01**: Bottom navigation is accessible, correctly sized (touch targets ≥44px), and highlights the active route
- [x] **MOB-02**: Feed cards are readable and tappable on small screens without horizontal overflow or clipping
- [x] **MOB-03**: Rating form (rate/[slug]) is fully usable on mobile — sliders, inputs, and submit button work without awkward layouts
- [ ] **MOB-04**: User profile and settings pages are correctly laid out on mobile — no overflow, avatar upload works on mobile
- [ ] **MOB-05**: Page transitions and navigation feel smooth on mobile (no layout jumps, consistent back behavior)
- [x] **MOB-06**: All tap targets across the app meet minimum size requirements — no tiny buttons or links

### Bug Hunt & Fixes

- [x] **BUG-01**: Systematically audit all user-facing flows for broken behavior (auth, rating, feed, profile, comments, likes, follow)
- [x] **BUG-02**: Fix all broken flows discovered in audit — each bug documented and resolved
- [x] **BUG-03**: Auth flow works correctly end-to-end on mobile (login, signup, session persistence, logout)
- [x] **BUG-04**: Rating submission flow completes without errors and shows correct success state
- [x] **BUG-05**: Comment and like actions work reliably without stale state or UI glitches
- [x] **BUG-06**: Avatar upload completes successfully and reflects immediately in UI

### Performance

- [x] **PERF-01**: Main feed (home page) load time reduced — identify and fix the bottleneck (queries, bundle, rendering)
- [x] **PERF-02**: Product/avatar images load efficiently — lazy loading, correct sizing, no layout shift
- [x] **PERF-03**: Page structure and layout rendering is clean — no unnecessary re-renders or layout thrash
- [x] **PERF-04**: Supabase queries in critical paths reviewed and optimized (remove N+1 patterns, add indexes where needed)
- [x] **PERF-05**: Feed implements basic pagination or infinite scroll — not loading all records at once

### Code Quality

- [ ] **QUAL-01**: `as any` casts in critical paths removed — `src/lib/queries.ts`, auth context, and rating form typed properly
- [ ] **QUAL-02**: Error handling standardized in data-fetching paths — consistent result pattern, no swallowed errors
- [ ] **QUAL-03**: File upload validation added to avatar upload — MIME type and size checked before sending to Supabase

### UX & Accessibility

- [x] **UX-01**: All interactive elements have visible focus states (keyboard navigation works)
- [ ] **UX-02**: Images have alt text; decorative images are marked appropriately
- [x] **UX-03**: Color contrast meets WCAG AA in both light and dark themes
- [x] **UX-04**: Empty states are handled gracefully — no blank pages when feed/results are empty
- [x] **UX-05**: Loading states are shown while data fetches — no content flash or invisible loading

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
| MOB-01 | Phase 1 | Complete |
| MOB-02 | Phase 1 | Complete |
| MOB-03 | Phase 1 | Complete |
| MOB-04 | Phase 1 | Pending |
| MOB-05 | Phase 1 | Pending |
| MOB-06 | Phase 1 | Complete |
| BUG-01 | Phase 2 | Complete |
| BUG-02 | Phase 2 | Complete |
| BUG-03 | Phase 2 | Complete |
| BUG-04 | Phase 2 | Complete |
| BUG-05 | Phase 2 | Complete |
| BUG-06 | Phase 2 | Complete |
| PERF-01 | Phase 3 | Complete |
| PERF-02 | Phase 3 | Complete |
| PERF-03 | Phase 3 | Complete |
| PERF-04 | Phase 3 | Complete |
| PERF-05 | Phase 3 | Complete |
| QUAL-01 | Phase 4 | Pending |
| QUAL-02 | Phase 4 | Pending |
| QUAL-03 | Phase 4 | Pending |
| UX-01 | Phase 4 | Complete |
| UX-02 | Phase 4 | Pending |
| UX-03 | Phase 4 | Complete |
| UX-04 | Phase 4 | Complete |
| UX-05 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-19 — BUG-01, BUG-02 marked complete after end-to-end audit sign-off (02-04)*
