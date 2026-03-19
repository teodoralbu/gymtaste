# Roadmap: GymTaste Pre-Launch Quality

## Overview

This milestone takes GymTaste from "it works on desktop" to "it feels right on a phone." Mobile UX comes first because most users will be on mobile. Then systematic bug fixing ensures every flow actually works. Then performance optimization makes it fast. Finally, code quality and accessibility polish round it out for launch.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Mobile UX** - Every screen and interaction works well on a phone
- [ ] **Phase 2: Bug Hunt & Fixes** - All user-facing flows work correctly end-to-end
- [ ] **Phase 3: Performance** - Pages load fast with efficient queries and proper pagination
- [ ] **Phase 4: Quality & Accessibility** - Code is type-safe, errors are handled, and the app is accessible

## Phase Details

### Phase 1: Mobile UX
**Goal**: Users on mobile devices have a polished, fully usable experience across every screen
**Depends on**: Nothing (first phase)
**Requirements**: MOB-01, MOB-02, MOB-03, MOB-04, MOB-05, MOB-06
**Success Criteria** (what must be TRUE):
  1. User can navigate the app on mobile using bottom nav — active route is highlighted, all tap targets are at least 44px
  2. User can scroll through the feed on a small screen without horizontal overflow, clipping, or unreadable cards
  3. User can complete the full rating flow on mobile — sliders, inputs, and submit button are usable without zooming or awkward layouts
  4. User can view and edit their profile/settings on mobile — avatar upload works, nothing overflows
  5. Page transitions feel smooth on mobile — no layout jumps when navigating between pages
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Fix touch targets and input font-sizes across all components
- [ ] 01-02-PLAN.md — Fix feed card overflow and rating form mobile layout
- [ ] 01-03-PLAN.md — Fix settings page layout and verify complete mobile experience

### Phase 2: Bug Hunt & Fixes
**Goal**: Every user-facing flow works correctly and completely from start to finish
**Depends on**: Phase 1
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06
**Success Criteria** (what must be TRUE):
  1. User can sign up, log in, stay logged in across sessions, and log out — all on mobile
  2. User can submit a rating for any product and see correct success confirmation
  3. User can comment on and like reviews without stale state, missing updates, or UI glitches
  4. User can upload an avatar and see it reflected immediately in the UI without refresh
  5. All user flows (auth, rating, feed, profile, comments, likes, follow) have been audited and broken behaviors fixed
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — Add Supabase session-refresh middleware + fix logout router.refresh (BUG-03)
- [x] 02-02-PLAN.md — Fix isFirst rating detection (pre-insert count) + duplicate submit guard (BUG-04)
- [x] 02-03-PLAN.md — Fix comment count stale bug + FollowButton optimistic update (BUG-05)
- [x] 02-04-PLAN.md — Add AvatarUpload file validation + end-to-end audit checkpoint (BUG-01, BUG-02, BUG-06)

### Phase 3: Performance
**Goal**: Pages load quickly and the app handles growing data without degradation
**Depends on**: Phase 2
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04, PERF-05
**Success Criteria** (what must be TRUE):
  1. Main feed loads noticeably faster after query/rendering bottleneck is identified and fixed
  2. Images load lazily with correct sizing and no visible layout shift
  3. Feed uses pagination or infinite scroll — not loading all records at once
  4. Critical Supabase queries have been reviewed — N+1 patterns removed, indexes added where needed
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Quality & Accessibility
**Goal**: The codebase is type-safe in critical paths, errors are handled consistently, and the app meets basic accessibility standards
**Depends on**: Phase 3
**Requirements**: QUAL-01, QUAL-02, QUAL-03, UX-01, UX-02, UX-03, UX-04, UX-05
**Success Criteria** (what must be TRUE):
  1. User can navigate the app with keyboard — all interactive elements have visible focus states
  2. User sees helpful loading states while data fetches and meaningful empty states when there is no data
  3. Color contrast meets WCAG AA in both light and dark themes
  4. Avatar upload validates file type and size before sending — invalid files are rejected with a clear message
  5. Critical data-fetching code (queries.ts, auth context, rating form) uses proper TypeScript types instead of `as any`
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Mobile UX | 2/3 | In Progress |  |
| 2. Bug Hunt & Fixes | 4/4 | Complete | 2026-03-19 |
| 3. Performance | 0/0 | Not started | - |
| 4. Quality & Accessibility | 0/0 | Not started | - |
