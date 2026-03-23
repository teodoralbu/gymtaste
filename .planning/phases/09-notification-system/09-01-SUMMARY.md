---
phase: 09-notification-system
plan: 01
subsystem: ui
tags: [notifications, supabase, server-actions, badge, bottom-nav]

# Dependency graph
requires:
  - phase: 08-comment-system
    provides: review_comments table and notification page foundation
provides:
  - getUnreadNotificationCount server action for counting new likes/comments/follows
  - markNotificationsSeen server action for clearing unread state
  - Red badge overlay on bell icon in BottomNav with count display
  - last_notifications_seen_at column on users table
affects: [10-product-enhancements, notification-system]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-side unread count fetch in layout, head-only count queries with Supabase]

key-files:
  created:
    - src/app/actions/notifications.ts
  modified:
    - src/lib/types.ts
    - src/components/layout/BottomNav.tsx
    - src/app/layout.tsx
    - src/app/notifications/page.tsx

key-decisions:
  - "Used head-only count queries (select with count: exact, head: true) for efficient unread counting"
  - "Badge clears on page load via markNotificationsSeen rather than per-notification read tracking"
  - "DB column last_notifications_seen_at defaults to NULL, treating all notifications as unread for first-time visitors"

patterns-established:
  - "Server action notification pattern: count queries in layout, mark-seen on page visit"

requirements-completed: [NOTIF-01, NOTIF-02, NOTIF-03]

# Metrics
duration: 2min
completed: 2026-03-23
---

# Phase 9 Plan 1: Notification Badge Summary

**Unread notification count badge on bottom nav bell icon with server-side count queries and mark-as-seen on page visit**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-23T08:57:06Z
- **Completed:** 2026-03-23T08:59:33Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Server actions for counting unread notifications (likes, comments, follows) since last visit
- Red badge on bell icon showing count (1-9) or "9+" for counts above 9
- Badge clears automatically when user visits /notifications page

## Task Commits

Each task was committed atomically:

1. **Task 1: DB migration + types + server actions for unread tracking** - `bfb2dc0` (feat)
2. **Task 2: Add unread badge to BottomNav and wire through layout** - `bf6be1c` (feat)

## Files Created/Modified
- `src/app/actions/notifications.ts` - Server actions: getUnreadNotificationCount and markNotificationsSeen
- `src/lib/types.ts` - Added last_notifications_seen_at to User interface and DB type
- `src/components/layout/BottomNav.tsx` - Added unreadCount prop and red badge overlay on bell icon
- `src/app/layout.tsx` - Made async, fetches unread count, passes to BottomNav
- `src/app/notifications/page.tsx` - Calls markNotificationsSeen after loading notifications

## Decisions Made
- Used head-only count queries (`select('*', { count: 'exact', head: true })`) for efficient counting without fetching rows
- Badge clears on page load via `markNotificationsSeen` rather than per-notification read tracking
- DB column `last_notifications_seen_at` defaults to NULL, treating all notifications as unread for first-time visitors

## Deviations from Plan

None - plan executed exactly as written.

Note: The SQL migration (`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_notifications_seen_at timestamptz DEFAULT NULL`) must be run manually against Supabase. The plan specified this as a manual step.

## Issues Encountered
None

## User Setup Required

**Database migration required.** Run the following SQL against Supabase:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_notifications_seen_at timestamptz DEFAULT NULL;
```

## Next Phase Readiness
- Notification badge infrastructure complete
- Ready for Phase 09 Plan 02 (if exists) or next phase
- DB migration must be applied before badge will function

---
*Phase: 09-notification-system*
*Completed: 2026-03-23*
