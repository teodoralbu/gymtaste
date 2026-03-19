---
phase: 03-performance
plan: 02
subsystem: ui
tags: [next-image, image-optimization, webp, avif, cls, lazy-loading, supabase-storage]

# Dependency graph
requires:
  - phase: 01-mobile-ux
    provides: Component structure and image rendering patterns
provides:
  - next/image across all remote images in the app
  - Supabase storage remotePatterns in next.config.ts
  - Automatic WebP/AVIF conversion and responsive sizing
  - Explicit width/height on all images preventing CLS
affects: [03-performance]

# Tech tracking
tech-stack:
  added: [next/image remote patterns]
  patterns: [next/image for all remote Supabase URLs, raw img only for blob URLs]

key-files:
  modified:
    - next.config.ts
    - src/components/feed/FeedCard.tsx
    - src/components/rating/CommentsSection.tsx
    - src/components/rating/ReviewCard.tsx
    - src/components/user/AvatarUpload.tsx
    - src/app/browse/page.tsx
    - src/app/notifications/page.tsx
    - src/app/users/[username]/page.tsx
    - src/app/leaderboard/page.tsx

key-decisions:
  - "Alias next/image as NextImage in AvatarUpload to avoid browser Image constructor collision"
  - "Keep blob URL previews (RatingForm, rep/page) as raw img since next/image cannot optimize local blobs"

patterns-established:
  - "next/image for remote: All Supabase storage images use next/image with explicit width/height"
  - "raw img for blobs: File upload previews using URL.createObjectURL keep raw img tags"
  - "NextImage alias: When a component uses both next/image and browser Image() for canvas, alias the import"

requirements-completed: [PERF-02, PERF-03]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 03 Plan 02: Image Optimization Summary

**Replaced all raw img tags with next/image across 9 files and configured Supabase remotePatterns for automatic WebP/AVIF conversion, responsive sizing, and CLS prevention**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T17:00:14Z
- **Completed:** 2026-03-19T17:04:13Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Configured next.config.ts with Supabase storage remote patterns for image optimization
- Converted 14 raw img tags to next/image across 9 files with explicit width/height dimensions
- Eliminated all unnecessary eslint-disable no-img-element comments (only 2 remain for legitimate blob URLs)

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure next.config.ts and convert FeedCard + core component images** - `a84357c` (feat)
2. **Task 2: Convert remaining page-level images to next/image** - `f006ccb` (feat)

## Files Created/Modified
- `next.config.ts` - Added Supabase remotePatterns for image optimization
- `src/components/feed/FeedCard.tsx` - Converted 5 img tags (2 avatars, progress photo, product thumbnail, review photo)
- `src/components/rating/CommentsSection.tsx` - Converted 1 comment avatar img
- `src/components/rating/ReviewCard.tsx` - Converted 1 review avatar img
- `src/components/user/AvatarUpload.tsx` - Converted 1 avatar display img (aliased as NextImage)
- `src/app/browse/page.tsx` - Converted 3 product images (dark horse, mobile list, desktop grid)
- `src/app/notifications/page.tsx` - Converted 1 notification avatar img
- `src/app/users/[username]/page.tsx` - Converted 2 profile avatars (mobile 72px, desktop 76px)
- `src/app/leaderboard/page.tsx` - Converted 1 member avatar img

## Decisions Made
- Aliased next/image as NextImage in AvatarUpload.tsx to avoid collision with browser's native Image constructor used for canvas-based compression
- Kept blob URL previews (RatingForm photo preview, rep/page progress preview) as raw img tags since next/image cannot optimize local blob/data URLs
- Did not convert files outside plan scope (settings, Navbar, RateSearch, AdminProductImages, RateLanding, products/[slug]) -- those remain with raw img tags

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Image constructor name collision in AvatarUpload.tsx**
- **Found during:** Task 2 (AvatarUpload conversion)
- **Issue:** Importing `Image` from next/image shadowed the browser's `new Image()` constructor used for canvas-based avatar compression, causing TypeScript error "Expected 1 arguments, but got 0"
- **Fix:** Aliased the import as `import NextImage from 'next/image'` and used `<NextImage>` in JSX
- **Files modified:** src/components/user/AvatarUpload.tsx
- **Verification:** `npm run build` passes successfully
- **Committed in:** f006ccb (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for build to pass. No scope creep.

## Issues Encountered
None beyond the auto-fixed Image constructor collision.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All remote images now use next/image with automatic optimization
- Additional files outside plan scope still have raw img tags (settings, Navbar, etc.) -- could be addressed in a future sweep
- Build passes, confirming all remotePatterns configured correctly

---
*Phase: 03-performance*
*Completed: 2026-03-19*
