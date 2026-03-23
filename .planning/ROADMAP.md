# Roadmap: GymTaste

## Milestones

- v1.0 **Pre-Launch Quality** - Phases 1-5 (shipped 2026-03-21)
- **v1.1 Feature Expansion** - Phases 6-12 (in progress)

## Phases

<details>
<summary>v1.0 Pre-Launch Quality (Phases 1-5) - SHIPPED 2026-03-21</summary>

Full archive: `.planning/milestones/v1.0-ROADMAP.md`

- [x] Phase 1: Mobile UX (3/3 plans) - completed 2026-03-18
- [x] Phase 2: Bug Hunt & Fixes (4/4 plans) - completed 2026-03-19
- [x] Phase 3: Performance (3/3 plans) - completed 2026-03-19
- [x] Phase 4: Quality & Accessibility (4/4 plans) - completed 2026-03-21
- [x] Phase 5: Security & Accessibility Polish (1/1 plan) - completed 2026-03-20

</details>

### v1.1 Feature Expansion (In Progress)

**Milestone Goal:** Overhaul the rating system, fix known bugs, expand social features (comment threads, notifications), upgrade the product page, and add a profile-based supplement calculator.

- [x] **Phase 6: Bug Fixes & UX Quick Wins** - Fix known bugs and add landing page hero image (completed 2026-03-22)
- [x] **Phase 7: Rating System Overhaul** - New rating dimensions, price capture, schema versioning (completed 2026-03-22)
- [x] **Phase 8: Comment System Upgrade** - Edit, delete, and single-level threaded replies (completed 2026-03-23)
- [ ] **Phase 9: Notification System** - Follow/like notifications, unread badge, followers list
- [ ] **Phase 10: Product Page Upgrade** - Hero image, label viewer, nutritional slider
- [ ] **Phase 11: Leaderboard Category Tabs** - Swipeable tabs by dimension and product type
- [ ] **Phase 12: Profile & Dosage Calculator** - Body stats, personalized dosage ranges, safety disclaimers

## Phase Details

### Phase 6: Bug Fixes & UX Quick Wins
**Goal**: Users encounter zero known bugs and the landing page makes a strong first impression
**Depends on**: Nothing (independent fixes)
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04, FIX-05
**Success Criteria** (what must be TRUE):
  1. User can set a username containing dots (e.g., "john.doe") without errors
  2. Email text is readable on light theme (proper contrast, not white-on-white)
  3. Taste/flavor tags display consistently across all product cards, or are absent consistently when not applicable
  4. Bottom navigation has no browse/search button (clean nav with only valid routes)
  5. Landing page displays a hero image alongside the "rate it before you waste it" tagline
**Plans:** 2/2 plans complete

Plans:
- [ ] 06-01-PLAN.md — Fix username regex, email text color, and tag consistency (FIX-01, FIX-02, FIX-03)
- [ ] 06-02-PLAN.md — Remove Browse tab from nav and add hero image (FIX-04, FIX-05)

### Phase 7: Rating System Overhaul
**Goal**: Users rate pre-workouts on meaningful dimensions and the platform cleanly separates old and new rating data
**Depends on**: Phase 6 (bugs fixed before major feature work)
**Requirements**: RATE-01, RATE-02, RATE-03, RATE-04
**Success Criteria** (what must be TRUE):
  1. User can submit a pre-workout rating with Flavor, Pump, and Energy & Focus scores (new dimensions replace old)
  2. User can enter the price they paid per container during review submission
  3. Value score appears automatically on the review, calculated from price and quality (no manual slider)
  4. Old reviews (pre-v1.1 schema) are hidden from all feeds, product pages, and leaderboards
**Plans:** 3/3 plans complete

Plans:
- [ ] 07-01-PLAN.md — DB migration + types + constants for v2 rating schema (RATE-01, RATE-02, RATE-03, RATE-04)
- [ ] 07-02-PLAN.md — RatingForm overhaul: new dimensions, price input, value score calc (RATE-01, RATE-02, RATE-03)
- [ ] 07-03-PLAN.md — ReviewCard value pill + schema_version filtering across all queries (RATE-03, RATE-04)

### Phase 8: Comment System Upgrade
**Goal**: Users can manage their comments and engage in threaded conversations
**Depends on**: Phase 7 (stable rating/review display before comment enhancements)
**Requirements**: COMM-01, COMM-02, COMM-03
**Success Criteria** (what must be TRUE):
  1. User can edit their own comment and the comment displays an "edited" marker afterward
  2. User can delete their own comment (thread structure preserved with placeholder if replies exist)
  3. User can reply to a top-level comment, and replies display nested under the parent (single level, Instagram style)
**Plans:** 2/2 plans complete

Plans:
- [ ] 08-01-PLAN.md — DB migration + types + comment count fix (COMM-01, COMM-02, COMM-03)
- [ ] 08-02-PLAN.md — Edit/delete UI + threaded reply UI in CommentsSection (COMM-01, COMM-02, COMM-03)

### Phase 9: Notification System
**Goal**: Users are informed when others interact with their content and can browse their social connections
**Depends on**: Phase 8 (comment infrastructure stable before wiring notification triggers)
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04
**Success Criteria** (what must be TRUE):
  1. User receives a notification when someone follows them
  2. User receives a notification when someone likes their review
  3. Unread notification count badge is visible on the notifications nav icon when unread notifications exist
  4. User can view their followers list and following list from their profile page
**Plans:** 2 plans

Plans:
- [ ] 09-01-PLAN.md — Unread badge on bell icon with DB tracking (NOTIF-01, NOTIF-02, NOTIF-03)
- [ ] 09-02-PLAN.md — Followers/following list pages and profile links (NOTIF-04)

### Phase 10: Product Page Upgrade
**Goal**: Product pages are visually compelling and provide detailed nutritional information
**Depends on**: Phase 7 (rating data feeds into product page display)
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04
**Success Criteria** (what must be TRUE):
  1. Product page displays a large hero image at the top
  2. User can open a label view showing full ingredients, sweeteners, and chemicals
  3. User can switch nutritional values between per scoop, per serving, and per 100g using a swipeable control
  4. Nutritional values display is visually polished and easy to scan
**Plans:** 2 plans

Plans:
- [ ] 09-01-PLAN.md — Unread badge on bell icon with DB tracking (NOTIF-01, NOTIF-02, NOTIF-03)
- [ ] 09-02-PLAN.md — Followers/following list pages and profile links (NOTIF-04)

### Phase 11: Leaderboard Category Tabs
**Goal**: Users can compare products across specific quality dimensions within product types
**Depends on**: Phase 7 (new rating dimensions must exist and accumulate data)
**Requirements**: LEAD-01, LEAD-02
**Success Criteria** (what must be TRUE):
  1. User can swipe between leaderboard tabs: Best Overall, Best Flavor, Best Pump, Best Value
  2. Leaderboards are filtered by product type, with Pre-workout as the first available category
**Plans:** 2 plans

Plans:
- [ ] 09-01-PLAN.md — Unread badge on bell icon with DB tracking (NOTIF-01, NOTIF-02, NOTIF-03)
- [ ] 09-02-PLAN.md — Followers/following list pages and profile links (NOTIF-04)

### Phase 12: Profile & Dosage Calculator
**Goal**: Users get personalized supplement guidance based on their body stats and goals
**Depends on**: Phase 10 (product page must be upgraded for contextual calculator display)
**Requirements**: CALC-01, CALC-02, CALC-03
**Success Criteria** (what must be TRUE):
  1. User can enter height, weight, and fitness goal (muscle gain / fat loss / endurance) on their profile settings
  2. Product pages display a dosage recommendation tailored to the user's saved profile data
  3. Calculator output includes a non-dismissable safety disclaimer citing recommended safe ranges (ISSN sources)
**Plans:** 2 plans

Plans:
- [ ] 09-01-PLAN.md — Unread badge on bell icon with DB tracking (NOTIF-01, NOTIF-02, NOTIF-03)
- [ ] 09-02-PLAN.md — Followers/following list pages and profile links (NOTIF-04)

## Progress

**Execution Order:** 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Mobile UX | v1.0 | 3/3 | Complete | 2026-03-18 |
| 2. Bug Hunt & Fixes | v1.0 | 4/4 | Complete | 2026-03-19 |
| 3. Performance | v1.0 | 3/3 | Complete | 2026-03-19 |
| 4. Quality & Accessibility | v1.0 | 4/4 | Complete | 2026-03-21 |
| 5. Security & Accessibility Polish | v1.0 | 1/1 | Complete | 2026-03-20 |
| 6. Bug Fixes & UX Quick Wins | v1.1 | Complete    | 2026-03-22 | - |
| 7. Rating System Overhaul | 3/3 | Complete    | 2026-03-22 | - |
| 8. Comment System Upgrade | v1.1 | Complete    | 2026-03-23 | - |
| 9. Notification System | v1.1 | 0/2 | Planning complete | - |
| 10. Product Page Upgrade | v1.1 | 0/? | Not started | - |
| 11. Leaderboard Category Tabs | v1.1 | 0/? | Not started | - |
| 12. Profile & Dosage Calculator | v1.1 | 0/? | Not started | - |

---
*Roadmap created: 2026-03-21*
*Last updated: 2026-03-22*
