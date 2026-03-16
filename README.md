# GYMTASTE

> **Rate it before you waste it.**

GYMTASTE is a social rating platform for gym supplement flavors. Users rate, review, and discover pre-workout supplement flavors so they never waste money on something that tastes terrible.

## Quick Start

### 1. Install
```bash
npm install
```

### 2. Set Up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local` and fill in your keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run the migration in Supabase SQL Editor: `supabase/migrations/001_initial_schema.sql`
4. Run the seed data: `supabase/seed.sql`
   > See comments in seed.sql for demo user auth setup instructions.

### 3. Run Dev Server
```bash
npm run dev
```
Open http://localhost:3000

## Tech Stack
- **Next.js 15** (App Router) + **TypeScript** (strict)
- **Tailwind CSS**
- **Supabase** (Postgres + Auth + Storage)

See `ARCHITECTURE.md` for full technical decisions.

## V1 Scope
Pre-workout supplements only. Architecture supports protein powder, energy drinks, and more without schema changes.
