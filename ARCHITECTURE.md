# GYMTASTE — Architecture

## Stack

| Layer | Technology | Reasoning |
|-------|-----------|-----------|
| Framework | Next.js 15 (App Router) | Best-in-class React framework. App Router enables server components for fast initial loads. File-based routing matches the product's page structure cleanly. |
| Language | TypeScript (strict) | Type safety across the full stack. Supabase generates types from the schema. |
| Styling | Tailwind CSS | Utility-first, fast iteration, great dark-mode support, no CSS files to maintain. |
| Database | Supabase (PostgreSQL) | Managed Postgres + built-in auth + storage + RLS. Perfect for a solo-dev MVP with complex relational data. |
| Auth | Supabase Auth | Email/password in V1. Row Level Security handles all authorization at the DB layer. |
| File Storage | Supabase Storage | Used for product images and user avatars. Buckets: `product-images`, `avatars`. |
| Barcode Scanning | @zxing/browser | Works in mobile browsers via device camera. Falls back to manual entry if camera unavailable. |
| Deployment | Vercel (recommended) / Netlify | Both support Next.js out of the box. No special config needed. |

## Key Architectural Decisions

### Multi-Category Design
The database is designed to support future supplement categories without schema changes:
- `categories` table defines each category (Pre-Workout, Protein Powder, etc.)
- `category_rating_dimensions` table defines per-category rating dimensions with weights
- `ratings.scores` is JSONB — flexible structure that accommodates any dimensions
- `ratings.overall_score` is pre-computed from weights and stored for fast leaderboard queries
- Adding a new category = insert into `categories` + insert dimension rows. Zero code changes required.

### Rating System
- Overall score = weighted average of dimension scores
- Pre-Workout weights: Taste 40%, Sweetness 20%, Mixability 20%, Aftertaste 20%
- Weights are stored in `category_rating_dimensions.weight` and must sum to 1.0 per category
- Score calculated in application layer (`src/lib/utils.ts → calculateOverallScore`) and stored to DB
- No unique constraint on (user_id, flavor_id) — users can re-rate the same flavor over time

### Auth & Security
- Supabase Auth handles session management via `@supabase/ssr`
- Row Level Security (RLS) enabled on all tables
- Public data (products, brands, flavors, ratings): read-only for all
- Write operations: authenticated users only, scoped to own data
- Rate limiting (20 ratings/hr, 50 comments/hr) enforced at application layer before DB inserts
- Image uploads: validated client-side (jpg/png/webp, max 5MB) + Supabase Storage policies

### State Management
- React Context for auth state (`useAuth` hook)
- No global state library — all data fetched per-page via service layer
- Service layer (`src/services/`) abstracts all Supabase calls — components never call Supabase directly

### Service Layer Pattern
```
Component → Service function → Supabase client → PostgreSQL
```
All database operations go through `src/services/`. This makes the app testable and the DB provider swappable.

## Folder Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # Primitive components (Button, Slider, Card, Modal, Badge)
│   ├── layout/             # Navbar, Footer, PageContainer
│   ├── flavor/             # FlavorCard, FlavorGrid, RatingModal, FlavorTags
│   ├── feed/               # ActivityFeedItem, ActivityFeed
│   ├── profile/            # ProfileHeader, RatedFlavorsList, BadgeTier
│   ├── review/             # ReviewCard, ReviewLikeButton, CommentSection
│   ├── search/             # SearchBar, SearchResults
│   ├── submit/             # BarcodeScanner, ProductSubmitForm
│   └── leaderboard/        # LeaderboardRow, TopReviewerCard
├── lib/
│   ├── supabase.ts         # Supabase browser client
│   ├── types.ts            # All TypeScript interfaces + Database type
│   ├── utils.ts            # Score calc, formatting, slugify, timeAgo
│   └── constants.ts        # Badge tiers, context tags, score weights, colors
├── services/               # All DB calls
│   ├── ratings.ts
│   ├── users.ts
│   ├── products.ts
│   ├── follows.ts
│   ├── reports.ts
│   └── submissions.ts
└── hooks/                  # useAuth, useRatings, useBarcodeScanner
```

## Database Schema Summary

14 tables:
- `categories` + `category_rating_dimensions` — extensible rating system
- `users` — extends Supabase `auth.users`
- `brands` + `products` + `flavors` + `flavor_tags` + `flavor_tag_assignments` — product catalog
- `ratings` — core content, JSONB scores, no unique constraint
- `review_likes` + `review_comments` — social interactions
- `follows` — social graph
- `reports` — moderation queue
- `product_submissions` — user-submitted product approval queue

## Supabase Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `product-images` | true | Product photos uploaded by users |
| `avatars` | true | User profile avatars |

## Future Categories (Design Only — V1 Ships Pre-Workout)

| Category | Status | Dimensions |
|----------|--------|-----------|
| Pre-Workout | ✅ Active | Taste, Sweetness, Mixability, Aftertaste |
| Protein Powder | 🔜 Coming Soon | Taste, Texture, Mixability, Aftertaste, Thickness |
| Energy Drinks | 🔜 Coming Soon | Taste, Sweetness, Carbonation, Aftertaste |
| Gym Ratings | 📋 Planned | Different model entirely |

Adding any of these requires: 1 row in `categories`, N rows in `category_rating_dimensions`. No code changes.
