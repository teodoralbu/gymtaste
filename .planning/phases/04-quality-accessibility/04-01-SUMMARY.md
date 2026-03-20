---
plan: 04-01
phase: 04-quality-accessibility
status: complete
completed: 2026-03-20
requirements: [QUAL-01, QUAL-02, QUAL-03]
---

# Plan 04-01: TypeScript Hygiene & Error Handling

## What Was Built

Removed all `as any` casts from 6 critical-path files and added consistent error handling to every Supabase query. Also fixed the Database type to properly satisfy Supabase v2.99+ generics.

## Key Changes

### Task 1: queries.ts (committed separately)
- Deleted all `const db = supabase as any` patterns — now uses typed client directly
- Added `.returns<T>()` annotations for join queries that Supabase can't auto-infer
- Defined explicit interfaces for complex join result shapes (`FlavorWithTags`, etc.)
- Added `{ data, error }` destructuring and `console.error` logging on every Supabase call
- Functions return `[]` or `null` on error for graceful degradation (QUAL-02)

### Task 2: Client components + types.ts fix
- `CommentsSection.tsx`: Removed `createClient() as any`, uses typed client; error handling on insert
- `LikeButton.tsx`: Removed `createClient() as any`; replaced dynamic `[targetColumn]` insert with type-safe conditional branching per table
- `RatingForm.tsx`: Removed `supabase as any`
- `rate/[slug]/page.tsx`: Removed `supabase as any`
- `auth-context.tsx`: Removed `supabase as any`; added missing `avatar_url: null, bio: null` to signUp insert

### types.ts: Database type fix (root cause of original `as any`)
- TypeScript interfaces don't have index signatures, so they don't satisfy `Record<string, unknown>` required by Supabase v2.99+ `GenericTable`
- Added `type R<T> = T & Record<string, unknown>` helper and applied it to all Row/Insert/Update types
- Added `Relationships: never[]` to all tables (required by `GenericTable`)
- Added missing `RepLike` interface and `rep_likes` table (used by `LikeButton`)

## Verification

- `grep -c "as any" src/lib/queries.ts src/context/auth-context.tsx src/components/rating/*.tsx src/app/rate/[slug]/page.tsx` → all 0
- `npx tsc --noEmit` → exits code 0
- QUAL-03: `src/components/user/AvatarUpload.tsx` contains MIME allowlist (`image/jpeg`, `image/png`, `image/webp`) and size validation

## Key Files

### key-files.modified
- src/lib/queries.ts
- src/lib/types.ts
- src/context/auth-context.tsx
- src/components/rating/CommentsSection.tsx
- src/components/rating/LikeButton.tsx
- src/components/rating/RatingForm.tsx
- src/app/rate/[slug]/page.tsx

## Decisions

- Used `R<T> = T & Record<string, unknown>` intersection rather than adding index signatures to all interfaces (less invasive, same effect)
- Used `Relationships: never[]` rather than `[]` (empty tuple doesn't extend `GenericRelationship[]` in TypeScript — this was the root cause of the original `as any` workarounds)
- Used conditional branching in LikeButton for type-safe polymorphic inserts rather than `as any` cast

## Self-Check: PASSED
