# Requirements: GymTaste

**Defined:** 2026-03-18 (v1.0) / 2026-03-21 (v1.1)
**Core Value:** Users can confidently discover and rate gym supplement flavors through a fast, polished mobile experience

## v1.0 Requirements (Shipped 2026-03-21)

### Mobile UX

- [x] **MOB-01**: Bottom navigation is accessible, correctly sized (touch targets >=44px), and highlights the active route
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
- [x] **QUAL-03**: File upload validation added to avatar upload — MIME type and size checked before sending to Supabase

### UX & Accessibility

- [x] **UX-01**: All interactive elements have visible focus states (keyboard navigation works)
- [x] **UX-02**: Images have alt text; decorative images are marked appropriately
- [x] **UX-03**: Color contrast meets WCAG AA in both light and dark themes
- [x] **UX-04**: Empty states are handled gracefully — no blank pages when feed/results are empty
- [x] **UX-05**: Loading states are shown while data fetches — no content flash or invisible loading

## v1.1 Requirements

### Bug Fixes & UX

- [ ] **FIX-01**: Username field allows `.` (dot) character
- [ ] **FIX-02**: Email text is visible on light theme (not white on white)
- [ ] **FIX-03**: All products consistently show taste/flavor tags (or none if not applicable)
- [ ] **FIX-04**: Browse/search button removed from bottom navigation
- [ ] **FIX-05**: Landing page ("rate it before you waste it") displays a hero image

### Rating System

- [ ] **RATE-01**: User can rate a pre-workout on Flavor, Pump, and Energy & Focus (replaces taste/sweetness/pump/energy/intensity)
- [ ] **RATE-02**: User can enter the price paid per container when submitting a review
- [ ] **RATE-03**: Value score is auto-calculated from price paid and quality score (no manual value slider)
- [ ] **RATE-04**: Old reviews (pre-v1.1 schema) are hidden from all feeds and product pages

### Comments

- [ ] **COMM-01**: User can edit their own comment (shows "edited" marker after edit)
- [ ] **COMM-02**: User can delete their own comment
- [ ] **COMM-03**: User can reply to a comment (single-level threading, Instagram style)

### Notifications

- [ ] **NOTIF-01**: User receives a notification when someone follows them
- [ ] **NOTIF-02**: User receives a notification when someone likes their review
- [ ] **NOTIF-03**: Unread notification badge appears on the notifications icon
- [ ] **NOTIF-04**: User can see their followers list and following list from their profile

### Product Page

- [ ] **PROD-01**: Product page shows a large hero image at the top
- [ ] **PROD-02**: User can open a product label view with full ingredients, sweeteners, and chemicals
- [ ] **PROD-03**: Nutritional values can be viewed per scoop / per serving / per 100g (swipeable)
- [ ] **PROD-04**: Nutritional values display has an improved visual design

### Leaderboard

- [ ] **LEAD-01**: User can swipe between leaderboard tabs: Best Overall, Best Flavor, Best Pump, Best Value
- [ ] **LEAD-02**: Leaderboards are grouped by product type (Pre-workout as the first category)

### Profile & Calculator

- [ ] **CALC-01**: User can enter height, weight, and fitness goal on their profile (muscle gain / fat loss / endurance)
- [ ] **CALC-02**: Product pages show a dosage recommendation based on the user's profile
- [ ] **CALC-03**: Calculator includes a safety disclaimer and cites recommended safe ranges

## v2 Requirements

- Protein powder rating category with tailored dimensions
- Energy drink rating category with tailored dimensions
- Test suite coverage
- Leaderboard materialized view (replace bounded 2000-row query)
- Social sharing

## Out of Scope

| Feature | Reason |
|---------|--------|
| Realtime notifications (WebSocket) | Polling sufficient at current scale |
| Infinite comment nesting | Mobile UX complexity; single-level replies is the right depth |
| Best Ingredients leaderboard | Users unfamiliar with ingredient scoring; admin data dependency |
| Medical/prescription framing for calculator | Liability — general guidance with disclaimer only |
| New features (social sharing, etc.) | Deferred to v2 |
| Test suite setup | Deferred to v2 |
| Search indexing | Deferred |
| Offline/PWA support | Deferred |
| Leaderboard materialized view | v2 |

## Traceability

### v1.0

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
| QUAL-03 | Phase 5 | Complete |
| UX-01 | Phase 4 | Complete |
| UX-02 | Phase 5 | Complete |
| UX-03 | Phase 4 | Complete |
| UX-04 | Phase 4 | Complete |
| UX-05 | Phase 4 | Complete |

### v1.1

| Requirement | Phase | Status |
|-------------|-------|--------|
| FIX-01 | Phase 6 | Pending |
| FIX-02 | Phase 6 | Pending |
| FIX-03 | Phase 6 | Pending |
| FIX-04 | Phase 6 | Pending |
| FIX-05 | Phase 6 | Pending |
| RATE-01 | Phase 7 | Pending |
| RATE-02 | Phase 7 | Pending |
| RATE-03 | Phase 7 | Pending |
| RATE-04 | Phase 7 | Pending |
| COMM-01 | Phase 8 | Pending |
| COMM-02 | Phase 8 | Pending |
| COMM-03 | Phase 8 | Pending |
| NOTIF-01 | Phase 9 | Pending |
| NOTIF-02 | Phase 9 | Pending |
| NOTIF-03 | Phase 9 | Pending |
| NOTIF-04 | Phase 9 | Pending |
| PROD-01 | Phase 10 | Pending |
| PROD-02 | Phase 10 | Pending |
| PROD-03 | Phase 10 | Pending |
| PROD-04 | Phase 10 | Pending |
| LEAD-01 | Phase 11 | Pending |
| LEAD-02 | Phase 11 | Pending |
| CALC-01 | Phase 12 | Pending |
| CALC-02 | Phase 12 | Pending |
| CALC-03 | Phase 12 | Pending |

**Coverage:**
- v1.1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-03-18 (v1.0)*
*Last updated: 2026-03-21 after v1.1 roadmap creation*
