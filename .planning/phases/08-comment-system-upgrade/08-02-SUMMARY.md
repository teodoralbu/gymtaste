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

duration: 3min
completed: 2026-03-23
---

# Phase 08 Plan 02: Comment UI Upgrade Summary

**Edit/delete via three-dot menu and long-press, single-level threaded replies with indented display, inline edit with edited marker, soft-delete placeholder rendering, swipe-to-reply gestures, comment animations, and iOS scroll/zoom fixes**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T12:36:52Z
- **Completed:** 2026-03-23
- **Tasks:** 3/3 complete
- **Files modified:** 1

## Accomplishments
- Full edit/delete functionality with three-dot menu and long-press trigger, inline edit textarea, and delete confirmation with soft/hard delete logic
- Single-level threaded reply UI with indented replies, accent border, smaller avatars, reply mode chip, and "View N more replies" expansion
- Comment interface updated with all new fields, loadComments fetches threading/delete/edit columns, client-side grouping via useMemo
- Swipe-to-reply gesture and comment entry/exit animations added post-checkpoint
- iOS scroll lock and input zoom issues fixed on comment sheet
- Human verification passed for all COMM-01, COMM-02, COMM-03 requirements

## Task Commits

Each task was committed atomically:

1. **Task 1+2: Edit/delete + reply threading UI** - `9984ca7` (feat)
2. **Post-checkpoint: Swipe-to-reply and animations** - `f0e08f1` (feat)
3. **Post-checkpoint: iOS scroll lock and input zoom fix** - `bfbd735` (fix)
4. **Task 3: Human verification** - approved, no code changes

Note: Tasks 1 and 2 were implemented together since they modify the same file and the code is deeply interleaved (renderComment function serves both, state resets cover both, etc.).

## Files Created/Modified
- `src/components/rating/CommentsSection.tsx` - Full comment system with edit, delete, threading, swipe-to-reply, animations, iOS fixes

## Decisions Made
- Combined Task 1 and Task 2 into a single implementation pass since renderComment, state variables, and the submit handler serve both features simultaneously
- Used SVG circles for three-dot kebab icon rather than Unicode characters for consistent rendering
- Reply placeholder text in input changes to "Reply to @username..." when in reply mode
- View more replies link uses singular "reply" vs plural "replies" based on count

## Deviations from Plan

None - plan executed as written. The only deviation is structural: Tasks 1 and 2 were committed together since they share the same code paths. Post-checkpoint commits added swipe-to-reply gestures, animations, and iOS fixes as polish.

## Issues Encountered
- iOS scroll lock and input zoom on comment sheet -- fixed in `bfbd735`

## User Setup Required
None - no external service configuration required. Migration from Plan 01 must be applied to Supabase.

## Next Phase Readiness
- All three COMM requirements verified by human in browser
- Comment system fully operational with edit, delete, threading, gestures, and iOS compatibility
- TypeScript compiles clean, Next.js build succeeds

---
*Phase: 08-comment-system-upgrade*
*Completed: 2026-03-23*

## Self-Check: PASSED
