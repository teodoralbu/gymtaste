---
phase: 08-comment-system-upgrade
plan: 02
subsystem: ui
tags: [react, comments, threading, inline-edit, soft-delete, long-press]

requires:
  - phase: 08-comment-system-upgrade
    provides: parent_comment_id, is_deleted, edited_at columns and RLS UPDATE policy
provides:
  - Edit/delete UI with three-dot menu and long-press
  - Single-level threaded reply UI with indented display
  - Reply mode chip with dismiss
  - Soft delete placeholder rendering
  - Inline edit with edited marker
affects: []

tech-stack:
  added: []
  patterns:
    - "renderComment helper for shared top-level/reply rendering with isReply flag"
    - "Client-side comment grouping via useMemo for topLevelComments and repliesByParent"
    - "Long-press detection with touchmove cancellation to avoid scroll conflicts"

key-files:
  created: []
  modified:
    - src/components/rating/CommentsSection.tsx

key-decisions:
  - "Combined Tasks 1 and 2 into single write since edit/delete and reply code are deeply interleaved in renderComment"
  - "Reply button uses minHeight 44px with flex align-items center for touch target"
  - "View more replies shows singular/plural text based on count"

patterns-established:
  - "renderComment(comment, isReply) pattern for shared comment row rendering"
  - "Three-dot kebab menu with SVG circles for comment options"
  - "Reply mode chip positioned between scrollable area and input form"

requirements-completed: [COMM-01, COMM-02, COMM-03]

duration: 2min
completed: 2026-03-22
---

# Phase 08 Plan 02: Comment UI Upgrade Summary

**Edit/delete via three-dot menu and long-press, single-level threaded replies with indented display, inline edit with edited marker, and soft-delete placeholder rendering**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T12:36:52Z
- **Completed:** 2026-03-22T12:39:00Z
- **Tasks:** 2 (Task 3 is human-verify checkpoint)
- **Files modified:** 1

## Accomplishments
- Full edit/delete functionality with three-dot menu and long-press trigger, inline edit textarea, and delete confirmation with soft/hard delete logic
- Single-level threaded reply UI with indented replies, accent border, smaller avatars, reply mode chip, and "View N more replies" expansion
- Comment interface updated with all new fields, loadComments fetches threading/delete/edit columns, client-side grouping via useMemo

## Task Commits

Each task was committed atomically:

1. **Task 1+2: Edit/delete + reply threading UI** - `9984ca7` (feat)

Note: Tasks 1 and 2 were implemented together since they modify the same file and the code is deeply interleaved (renderComment function serves both, state resets cover both, etc.).

## Files Created/Modified
- `src/components/rating/CommentsSection.tsx` - Full comment system with edit, delete, threading (352 -> 471 lines net)

## Decisions Made
- Combined Task 1 and Task 2 into a single implementation pass since renderComment, state variables, and the submit handler serve both features simultaneously
- Used SVG circles for three-dot kebab icon rather than Unicode characters for consistent rendering
- Reply placeholder text in input changes to "Reply to @username..." when in reply mode
- View more replies link uses singular "reply" vs plural "replies" based on count

## Deviations from Plan

None - plan executed as written. The only deviation is structural: Tasks 1 and 2 were committed together since they share the same code paths.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Migration from Plan 01 must be applied to Supabase.

## Next Phase Readiness
- All three COMM requirements implemented in code
- Awaiting human verification (Task 3 checkpoint) to confirm browser behavior
- TypeScript compiles clean, Next.js build succeeds

---
*Phase: 08-comment-system-upgrade*
*Completed: 2026-03-22*

## Self-Check: PASSED
