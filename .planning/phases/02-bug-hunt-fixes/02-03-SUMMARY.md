---
phase: 02-bug-hunt-fixes
plan: 03
subsystem: ui
tags: [react, optimistic-update, supabase, toast, follow, comments]

# Dependency graph
requires:
  - phase: 02-bug-hunt-fixes
    provides: Bug research identifying stale comment count and silent FollowButton errors
provides:
  - Comment count increments immediately on feed card after posting via onCommentPosted callback
  - FollowButton optimistic update with wasFollowing revert-on-error pattern and toast feedback
affects: [feed, user-profiles, comments, follow-system]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Callback prop threading: parent passes setCount incrementer as onCommentPosted to child sheet"
    - "Optimistic update with revert: capture wasFollowing, update state before await, revert + toast on error"

key-files:
  created: []
  modified:
    - src/components/rating/CommentsSection.tsx
    - src/components/user/FollowButton.tsx

key-decisions:
  - "Mirror LikeButton pattern exactly for FollowButton — wasFollowing captured before setFollowing, both error branches revert and toast"
  - "onCommentPosted is optional (?) to preserve backward compatibility with any existing usages of CommentBottomSheet"

patterns-established:
  - "Optimistic toggle pattern: capture prev state -> update optimistically -> await DB -> revert on error -> showToast"
  - "Callback threading pattern: parent holds count state, passes increment callback as optional prop to child sheet"

requirements-completed: [BUG-05]

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 02 Plan 03: Comment Count Callback + FollowButton Optimistic Update Summary

**onCommentPosted callback wired into CommentBottomSheet so feed card comment count increments immediately, and FollowButton rewritten with optimistic toggle, wasFollowing revert-on-error, and toast feedback**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T10:19:16Z
- **Completed:** 2026-03-19T10:21:26Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- CommentsSection now passes `onCommentPosted={() => setCount((c) => c + 1)}` to CommentBottomSheet; the sheet calls it after a successful insert so the feed card count updates without reload
- FollowButton rewritten to optimistically flip state before the DB await, capture `wasFollowing` for revert, and call `showToast` on both delete and insert errors
- Added `if (loading) return` guard to FollowButton to prevent double-tap race conditions

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire onCommentPosted callback to fix stale comment count** - `0255c62` (fix)
2. **Task 2: Add optimistic update and error handling to FollowButton** - `346fc60` (fix)

## Files Created/Modified
- `src/components/rating/CommentsSection.tsx` - Added onCommentPosted prop to CommentBottomSheet, call site in handleSubmit, and wiring in CommentsSection JSX
- `src/components/user/FollowButton.tsx` - Full rewrite with useToast, optimistic update, wasFollowing revert, loading guard

## Decisions Made
- Mirrored the existing LikeButton pattern exactly for FollowButton to maintain consistency across interactive actions
- Made `onCommentPosted` optional (`?`) in the CommentBottomSheet interface to avoid breaking any direct usages of the sheet without a parent count

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Task 1 verification script used `onCommentPosted\?\?:` (double `?`) in its regex which caused a false FAIL, but the actual file was correct with `onCommentPosted?: () => void`. All acceptance criteria grep counts passed correctly (4, 2, 2, 1).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both interactive bugs resolved; feed cards and user profiles now feel responsive
- No blockers for remaining plans in phase 02

## Self-Check: PASSED
- src/components/rating/CommentsSection.tsx: FOUND
- src/components/user/FollowButton.tsx: FOUND
- .planning/phases/02-bug-hunt-fixes/02-03-SUMMARY.md: FOUND
- Commit 0255c62: FOUND
- Commit 346fc60: FOUND
