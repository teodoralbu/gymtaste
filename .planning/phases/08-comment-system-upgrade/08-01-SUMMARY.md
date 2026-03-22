---
phase: 08-comment-system-upgrade
plan: 01
subsystem: database
tags: [supabase, postgres, rls, threading, soft-delete]

requires:
  - phase: 01-foundation
    provides: review_comments table with basic columns and RLS
provides:
  - parent_comment_id column for threaded replies
  - is_deleted column for soft delete
  - edited_at column for edit tracking
  - RLS UPDATE policy for comment owners
  - Updated ReviewComment TypeScript interface
  - Filtered comment counts excluding deleted
affects: [08-02-comment-ui]

tech-stack:
  added: []
  patterns:
    - "Soft delete via is_deleted boolean with nullable text"
    - "edited_at timestamp over boolean for richer edit tracking"

key-files:
  created:
    - supabase/migrations/004_comment_threading.sql
  modified:
    - src/lib/types.ts
    - src/lib/queries.ts
    - src/components/rating/CommentsSection.tsx

key-decisions:
  - "text column made nullable to support soft-delete text clearing"
  - "edited_at uses TIMESTAMPTZ over boolean for richer data"
  - "Partial index on parent_comment_id WHERE NOT NULL for efficient reply queries"

patterns-established:
  - "Soft delete: set is_deleted=true and clear text to null"
  - "RLS UPDATE policy pattern: USING (auth.uid() = user_id)"

requirements-completed: [COMM-01, COMM-02, COMM-03]

duration: 1min
completed: 2026-03-22
---

# Phase 08 Plan 01: Comment Schema Foundation Summary

**Comment threading migration with parent_comment_id, soft delete via is_deleted, edit tracking via edited_at, and RLS UPDATE policy for comment owners**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-22T12:33:03Z
- **Completed:** 2026-03-22T12:34:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created migration adding 3 columns, dropping NOT NULL, adding partial index, and RLS UPDATE policy
- Updated ReviewComment TypeScript interface with new fields and nullable text
- Both feed comment count queries now filter out soft-deleted comments

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Supabase migration for comment threading** - `cef406c` (feat)
2. **Task 2: Update ReviewComment type and comment count queries** - `358ce1c` (feat)

## Files Created/Modified
- `supabase/migrations/004_comment_threading.sql` - Migration with threading, soft delete, edit tracking columns + RLS UPDATE policy
- `src/lib/types.ts` - ReviewComment interface with new fields, Database Insert type updated
- `src/lib/queries.ts` - Both feed comment count queries filter is_deleted=false
- `src/components/rating/CommentsSection.tsx` - Fixed nullable text type handling

## Decisions Made
- text column made nullable to allow soft-delete text clearing (CHECK constraint passes for NULL)
- edited_at uses TIMESTAMPTZ instead of boolean for richer edit data
- Partial index on parent_comment_id filters WHERE NOT NULL for efficient reply lookups
- Database Insert type omits is_deleted and edited_at entirely, makes parent_comment_id optional

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CommentsSection type error from nullable text**
- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** CommentsSection.tsx callback parameter typed text as `string` but ReviewComment now has `string | null`
- **Fix:** Updated parameter type to `string | null` and added `?? ''` fallback
- **Files modified:** src/components/rating/CommentsSection.tsx
- **Verification:** npx tsc --noEmit passes clean
- **Committed in:** 358ce1c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessary for type correctness after making text nullable. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Migration must be applied to Supabase when ready.

## Next Phase Readiness
- Schema foundation complete for comment threading, editing, and soft delete
- RLS UPDATE policy in place for both edit and soft-delete operations
- Ready for 08-02 UI implementation of comment features

---
*Phase: 08-comment-system-upgrade*
*Completed: 2026-03-22*

## Self-Check: PASSED
