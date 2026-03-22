# Phase 8: Comment System Upgrade - Research

**Researched:** 2026-03-22
**Domain:** Supabase schema migration, React state management for threaded comments, inline editing UX
**Confidence:** HIGH

## Summary

Phase 8 adds edit, delete, and single-level threaded replies to the existing `CommentsSection.tsx` bottom sheet. The current implementation is a flat list of comments with no threading, no edit capability, and only a client-side Supabase delete pattern. The existing code is clean and well-structured (~350 lines), making it a solid foundation.

Three changes are needed: (1) a Supabase migration adding `parent_comment_id`, `is_deleted`, `is_edited`/`edited_at` columns plus an RLS UPDATE policy, (2) updated TypeScript types in `types.ts` and `Database` type, and (3) significant UI work in `CommentsSection.tsx` to render threaded replies, inline edit mode, three-dot menu / long-press actions, delete confirmation, and reply-mode chip. The comment count queries in `queries.ts` need a filter to exclude soft-deleted rows.

**Primary recommendation:** Structure implementation as three waves: (1) DB migration + type updates, (2) edit/delete functionality, (3) reply threading UI. Each wave builds on the previous and can be verified independently.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Both three-dot menu and long-press trigger edit/delete options -- visible only on user's own comments
- Inline edit: comment bubble transforms into editable text field in place, with Save/Cancel buttons
- "edited" marker: small lowercase `edited` text after timestamp -- e.g. `2h . edited`, same dim color
- Delete with no replies: immediate removal (optimistic, then DB delete)
- Delete with replies: soft delete, row shows `[Comment deleted]` placeholder, no username exposed
- Stored as soft delete: `is_deleted boolean default false`, text cleared/nulled on delete
- Replies indented under parent with left border/accent line, smaller avatars (20-24px)
- "Reply" text button below each top-level comment, tapping focuses main input bar
- Dismissable chip above input: `Replying to @username x`, tapping X cancels reply mode
- Single level only -- replies cannot be replied to
- 20 top-level comments loaded on sheet open (unchanged)
- Up to 5 replies per top-level comment loaded inline
- If >5 replies, show "View N more replies" link

### Claude's Discretion
- Exact left-indent size and border style for reply nesting (suggest 20-24px indent with 2px accent-colored left border)
- Confirmation dialog before delete (suggested: inline "Delete?" with Delete/Cancel)
- Whether `is_edited` is a boolean or a timestamp (`edited_at`) -- either works, timestamp is richer
- Three-dot menu position and popover style within the comment row

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMM-01 | User can edit their own comment (shows "edited" marker after edit) | DB migration adds `is_edited`/`edited_at` column, RLS UPDATE policy enables client-side update, inline edit UI pattern documented |
| COMM-02 | User can delete their own comment | Soft delete via `is_deleted` column, existing RLS DELETE policy works for hard delete; soft delete uses UPDATE (new policy needed), placeholder rendering for deleted-with-replies |
| COMM-03 | User can reply to a comment (single-level threading, Instagram style) | `parent_comment_id` column with self-referential FK, query restructuring to fetch parent+child grouping, reply mode state management, nested UI rendering |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.99.1 | DB queries, RLS-enforced CRUD | Already in use, client-side pattern established |
| Next.js | 16.1.6 | App framework | Already in use |
| React | 19.2.3 | UI rendering | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | - | - | All functionality built with existing stack |

No new dependencies required. The comment upgrade uses existing Supabase client calls, React state, and inline styles -- consistent with the established pattern.

## Architecture Patterns

### Current File Structure (no new files needed)
```
supabase/
  migrations/
    004_comment_threading.sql    # NEW: schema changes
src/
  components/rating/
    CommentsSection.tsx          # MODIFY: all UI changes here
  lib/
    types.ts                    # MODIFY: update ReviewComment + Database type
    queries.ts                  # MODIFY: filter is_deleted from comment counts
```

### Pattern 1: Supabase Migration for Comment Threading
**What:** Add three columns to `review_comments` plus an RLS UPDATE policy
**When to use:** This is the foundation -- must be done first

The migration must:
1. Add `parent_comment_id UUID REFERENCES review_comments(id) ON DELETE CASCADE` (nullable -- null means top-level)
2. Add `is_deleted BOOLEAN NOT NULL DEFAULT false`
3. Add `edited_at TIMESTAMPTZ` (recommendation: use timestamp over boolean -- richer data, same storage cost, and the planner can derive "edited" display from `edited_at IS NOT NULL`)
4. Add index on `parent_comment_id` for efficient reply fetching
5. Add RLS UPDATE policy: `auth.uid() = user_id` -- **CRITICAL: no UPDATE policy exists today**
6. The UPDATE policy should restrict which columns can be updated (text, is_deleted, edited_at)

**Important RLS note:** The existing schema has SELECT (public), INSERT (authenticated, uid=user_id), and DELETE (owner) policies. There is NO UPDATE policy. Both edit and soft-delete require UPDATE, so this must be added.

### Pattern 2: Soft Delete with Optimistic UI
**What:** Delete flow that preserves thread structure
**When to use:** COMM-02, when comment has replies

```
// Decision tree for delete:
if (comment has replies) {
  // Soft delete: UPDATE set is_deleted=true, text=null
  // UI shows [Comment deleted] placeholder
} else {
  // Hard delete: DELETE from review_comments
  // Row removed from UI immediately (optimistic)
}
```

The soft delete approach uses UPDATE (setting `is_deleted = true` and clearing `text` to null), not DELETE. This preserves the row so child comments remain attached via `parent_comment_id`. Client renders `[Comment deleted]` when `is_deleted = true`.

**Text column constraint issue:** The current schema has `CHECK (char_length(text) <= 280)` but also `NOT NULL`. For soft delete, text needs to be nullable OR set to empty string. Recommendation: ALTER to allow NULL on soft delete, since the text constraint check `char_length(text) <= 280` already passes for NULL in PostgreSQL (NULL comparisons return NULL, not false, so CHECK passes).

Wait -- actually, the `NOT NULL` constraint on `text` will block setting it to NULL. The migration must `ALTER COLUMN text DROP NOT NULL` to enable soft-delete text clearing.

### Pattern 3: Threaded Comment Data Structure
**What:** Transform flat comment list into parent-child groups
**When to use:** COMM-03 reply threading

Current query fetches flat list ordered by `created_at`. New approach:
1. Fetch top-level comments (where `parent_comment_id IS NULL` and `is_deleted = false` OR has replies)
2. Fetch replies grouped by parent (where `parent_comment_id IS NOT NULL`)
3. Client-side: group replies under their parent, limit to 5 visible per parent

The query should fetch in a single call using `.or()` filter or fetch all and group client-side (simpler, already the pattern used). Given the 20-comment limit, client-side grouping is efficient.

### Pattern 4: Reply Mode State Management
**What:** Track reply target in component state
**When to use:** COMM-03 reply input UX

```typescript
// State needed in CommentBottomSheet:
const [replyingTo, setReplyingTo] = useState<{
  commentId: string
  username: string
} | null>(null)

// On "Reply" tap: setReplyingTo({ commentId, username })
// On chip dismiss or submit: setReplyingTo(null)
// On submit: include parent_comment_id in insert if replyingTo is set
```

### Pattern 5: Inline Edit Mode
**What:** Transform comment bubble into editable text field
**When to use:** COMM-01 edit flow

```typescript
// State needed:
const [editingId, setEditingId] = useState<string | null>(null)
const [editText, setEditText] = useState('')

// On "Edit" tap: setEditingId(comment.id), setEditText(comment.text)
// On Save: UPDATE review_comments SET text=editText, edited_at=now()
// On Cancel: setEditingId(null)
```

### Pattern 6: Established Project Patterns to Follow
- **Inline styles with CSS variables** -- no Tailwind in comment components (established pattern)
- **`minHeight: '44px'`** touch targets on all interactive elements
- **Optimistic UI** -- `loadComments()` called after mutations to refresh
- **Client-side Supabase calls** -- not via `queries.ts` for comment operations
- **`createClient()` via `useMemo`** -- already in CommentsSection

### Anti-Patterns to Avoid
- **Adding new component files:** Keep everything in `CommentsSection.tsx` -- the file is currently 350 lines and will grow to ~600-700, which is manageable for a single bottom sheet component. Breaking into sub-components adds import complexity for minimal benefit at this scale.
- **Using Tailwind classes in comments:** The existing component uses zero Tailwind -- all inline styles with CSS variables. Stay consistent.
- **Realtime subscriptions:** Out of scope per REQUIREMENTS.md. Polling via `loadComments()` on mutations is the established pattern.
- **Deep nesting (multi-level replies):** Explicitly out of scope. Replies to replies must be blocked at UI level (no Reply button on reply comments).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Long-press detection | Custom touch event math | `onTouchStart`/`onTouchEnd` with setTimeout (300ms) | Simple pattern, no library needed, but handle touch-move cancellation |
| Popover/menu positioning | Complex absolute positioning logic | Simple dropdown below the three-dot button with fixed positioning | Comment rows are in a scrollable container; keep menu simple |
| Optimistic state management | Custom cache/rollback system | Re-fetch via existing `loadComments()` pattern | Consistency with current approach; comment lists are small enough |

**Key insight:** This phase has no deceptively complex sub-problems. The patterns are straightforward CRUD operations with UI state management. The main risk is in the migration correctness and ensuring RLS policies cover all operations.

## Common Pitfalls

### Pitfall 1: Missing RLS UPDATE Policy
**What goes wrong:** Edit and soft-delete operations fail silently (Supabase returns empty data, no error) because no UPDATE policy exists on `review_comments`.
**Why it happens:** The original schema only anticipated INSERT/DELETE/SELECT, not UPDATE.
**How to avoid:** Migration MUST add `CREATE POLICY "review_comments: owner update" ON review_comments FOR UPDATE USING (auth.uid() = user_id)`.
**Warning signs:** Edit saves silently do nothing; `is_deleted` never actually gets set to true.

### Pitfall 2: NOT NULL Constraint on Text Column Blocks Soft Delete
**What goes wrong:** Attempting `UPDATE review_comments SET text = NULL WHERE id = X` fails because `text` has a NOT NULL constraint.
**Why it happens:** Original schema: `text TEXT NOT NULL CHECK (char_length(text) <= 280)`.
**How to avoid:** Migration must include `ALTER TABLE review_comments ALTER COLUMN text DROP NOT NULL`.
**Warning signs:** Soft delete throws a constraint violation error.

### Pitfall 3: Comment Count Inflated by Deleted Comments
**What goes wrong:** Feed shows "5 comments" but user sees only 3 (2 are soft-deleted).
**Why it happens:** `queries.ts` counts ALL rows in `review_comments` for a rating -- no `is_deleted` filter.
**How to avoid:** Update both `getUnifiedFeed` and `getFollowingUnifiedFeed` to add `.eq('is_deleted', false)` to comment count queries.
**Warning signs:** Comment count on feed cards doesn't match visible comments in the sheet.

### Pitfall 4: Reply Count Included in Top-Level Comment Count
**What goes wrong:** Comment count on feed cards includes replies, making numbers seem inflated.
**Why it happens:** The count query fetches all `review_comments` rows for a rating.
**How to avoid:** Decide intentionally: either count ALL comments (top-level + replies) or only top-level. Instagram counts all -- recommend counting all non-deleted comments. Just be consistent.
**Warning signs:** User posts a reply and the feed card count goes from 1 to 2 (which is actually correct if counting all).

### Pitfall 5: Long-Press Conflicts with Scroll
**What goes wrong:** Long-pressing a comment while scrolling triggers the edit/delete menu.
**Why it happens:** `touchstart` fires before the scroll gesture is detected.
**How to avoid:** Cancel the long-press timeout on `touchmove` (check if touch moved more than ~10px). Also cancel on `touchend` if timer hasn't fired.
**Warning signs:** Menu appears while user is trying to scroll through comments.

### Pitfall 6: Orphaned Reply UI When Parent is Deleted
**What goes wrong:** After deleting a parent comment (soft delete), the reply section looks broken.
**Why it happens:** UI doesn't handle the `is_deleted` parent case for rendering.
**How to avoid:** When `is_deleted = true`, render the `[Comment deleted]` placeholder but still show its replies underneath. The placeholder row should NOT have Reply/Edit/Delete buttons.
**Warning signs:** Replies appear under a blank or missing parent.

### Pitfall 7: Edit State Persists After Sheet Close
**What goes wrong:** User opens sheet, starts editing, closes sheet, reopens -- edit mode is still active.
**Why it happens:** State isn't reset on sheet close.
**How to avoid:** Reset `editingId`, `editText`, `replyingTo` when `open` changes to `false`.
**Warning signs:** Stale edit UI appears on sheet reopen.

## Code Examples

### Migration SQL (verified against existing schema patterns)
```sql
-- 004_comment_threading.sql

-- 1. Add threading and soft-delete columns
ALTER TABLE public.review_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES review_comments(id) ON DELETE CASCADE;

ALTER TABLE public.review_comments
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.review_comments
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 2. Allow text to be NULL (needed for soft delete text clearing)
ALTER TABLE public.review_comments
  ALTER COLUMN text DROP NOT NULL;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_review_comments_parent_id
  ON public.review_comments(parent_comment_id)
  WHERE parent_comment_id IS NOT NULL;

-- 4. RLS UPDATE policy (does not exist yet -- required for edit and soft delete)
CREATE POLICY "review_comments: owner update"
  ON public.review_comments FOR UPDATE
  USING (auth.uid() = user_id);
```

### Updated TypeScript Interface
```typescript
// In src/lib/types.ts
export interface ReviewComment {
  id: string
  rating_id: string
  user_id: string
  text: string | null          // nullable for soft delete
  parent_comment_id: string | null  // null = top-level
  is_deleted: boolean
  edited_at: string | null     // ISO timestamp, null = never edited
  created_at: string
}
```

### Comment Count Query Fix
```typescript
// In queries.ts -- add is_deleted filter
supabase
  .from('review_comments')
  .select('rating_id')
  .in('rating_id', ratingIds)
  .eq('is_deleted', false)  // <-- add this
  .returns<CommentCountRow[]>()
```

### Threaded Comment Fetch Pattern
```typescript
// Fetch all comments for a rating, then group client-side
const { data } = await db
  .from('review_comments')
  .select('id, text, created_at, user_id, parent_comment_id, is_deleted, edited_at')
  .eq('rating_id', ratingId)
  .order('created_at', { ascending: true })

// Group: top-level comments and their replies
const topLevel = data.filter(c => !c.parent_comment_id)
const repliesByParent: Record<string, typeof data> = {}
for (const c of data.filter(c => c.parent_comment_id)) {
  const pid = c.parent_comment_id!
  if (!repliesByParent[pid]) repliesByParent[pid] = []
  repliesByParent[pid].push(c)
}
```

### Long-Press Handler Pattern
```typescript
const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
const touchStartPos = useRef<{ x: number; y: number } | null>(null)

const onTouchStart = (e: React.TouchEvent, commentId: string) => {
  touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  longPressRef.current = setTimeout(() => {
    // Show menu for commentId
    setMenuOpenFor(commentId)
  }, 500)
}

const onTouchMove = (e: React.TouchEvent) => {
  if (!touchStartPos.current) return
  const dx = e.touches[0].clientX - touchStartPos.current.x
  const dy = e.touches[0].clientY - touchStartPos.current.y
  if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
    if (longPressRef.current) clearTimeout(longPressRef.current)
  }
}

const onTouchEnd = () => {
  if (longPressRef.current) clearTimeout(longPressRef.current)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat comment list | Threaded (single-level) | This phase | Comments become conversations |
| Hard delete only | Soft delete for threaded comments | This phase | Thread structure preserved |
| No edit capability | Inline edit with edited marker | This phase | Users can correct mistakes |

## Open Questions

1. **Should soft-deleted comments with zero remaining visible replies be fully hidden?**
   - What we know: A deleted parent whose replies are also all deleted would show `[Comment deleted]` with nothing under it
   - What's unclear: Is that placeholder useful or just noise?
   - Recommendation: Show the placeholder regardless (simpler logic). Edge case is rare and harmless.

2. **"View N more replies" loading behavior**
   - What we know: Initial fetch loads 5 replies per parent
   - What's unclear: Does tapping "View more" fetch ALL remaining replies or another batch of 5?
   - Recommendation: Fetch all remaining (single-level replies rarely exceed 20). Simpler implementation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (test suite deferred to v2 per project decision) |
| Config file | none |
| Quick run command | Manual verification |
| Full suite command | N/A |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMM-01 | Edit comment, see "edited" marker | manual-only | N/A -- verify in browser | N/A |
| COMM-02 | Delete own comment (with/without replies) | manual-only | N/A -- verify in browser | N/A |
| COMM-03 | Reply to comment, see nested display | manual-only | N/A -- verify in browser | N/A |

**Manual-only justification:** Project explicitly defers test suite to v2 (see STATE.md: "Skip test suite -- not blocking launch, deferred"). Zero test infrastructure exists.

### Sampling Rate
- **Per task commit:** Manual browser verification of the specific feature
- **Per wave merge:** Full comment flow walkthrough (post, edit, delete, reply, view thread)
- **Phase gate:** All three COMM requirements manually verified

### Wave 0 Gaps
None -- no test infrastructure to set up per project decision.

## Sources

### Primary (HIGH confidence)
- `src/components/rating/CommentsSection.tsx` -- full existing implementation reviewed (350 lines)
- `src/lib/types.ts` -- `ReviewComment` interface at line 107-113, `Database` type at line 284
- `src/lib/queries.ts` -- comment count queries at lines 486, 580
- `supabase/migrations/001_initial_schema.sql` -- `review_comments` table definition, RLS policies
- `supabase/migrations/002_core_alignment.sql` -- additional RLS policies for review_comments
- `supabase/migrations/003_rating_system_v2.sql` -- migration pattern reference

### Secondary (MEDIUM confidence)
- Supabase PostgreSQL RLS behavior: CHECK constraints pass on NULL (standard PostgreSQL behavior)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, existing patterns fully understood from source code
- Architecture: HIGH -- single file modification with clear migration pattern from prior phases
- Pitfalls: HIGH -- identified from direct code analysis (missing UPDATE policy, NOT NULL constraint, count query gap)

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- no external dependency changes expected)
