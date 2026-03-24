---
phase: 12-profile-dosage-calculator
plan: "02"
subsystem: ui, database
tags: [dosage-calculator, body-stats, settings, product-page]

requires:
  - phase: 12-01
    provides: dosage calculation engine, types, constants

provides:
  - Body Stats form section on settings page
  - DosageCalculator component embedded in product pages
  - Non-dismissable safety disclaimer with ISSN citations

key-files:
  created:
    - src/app/products/[slug]/DosageCalculator.tsx
  modified:
    - src/app/settings/page.tsx
    - src/app/products/[slug]/page.tsx

key-decisions:
  - "DosageCalculator.tsx used (not DosageCard.tsx) — Plan 01 went beyond scope and built the component with a richer UI"
  - "Body stats use a separate bodyStats state object from the profile form to allow independent save handlers"
  - "Logged-out users see a login CTA; users with no stats see a settings CTA — no blank states"

requirements-completed: [CALC-01, CALC-02, CALC-03]

completed: 2026-03-24
---

# Phase 12 Plan 02: Settings Body Stats + DosageCalculator Summary

**Body stats form on settings page + personalized DosageCalculator component on product pages with ISSN citations and non-dismissable safety disclaimer**

## Accomplishments

- Body Stats section on settings page with height (cm), weight (kg), and fitness goal selector
- `DosageCalculator.tsx` on product pages with three states: logged-out CTA, no-stats CTA, full calculator
- Personalized dosage ranges per ingredient scaled by body weight and fitness goal
- ISSN citation displayed per ingredient row
- Non-dismissable "Safety Disclaimer" section (yellow header, always visible)
- Serving count recommendation (e.g. "take 1–2 servings") derived from product's per-serving amount

## Deviations from Plan

- Component named `DosageCalculator.tsx` instead of `DosageCard.tsx` — Plan 01 already created it with a richer implementation; no change needed
- Body stats use a separate `bodyStats` state from the profile `form` state — cleaner UX with independent save handling

## User Setup Required

DB migration must be run in Supabase SQL Editor:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm SMALLINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS fitness_goal TEXT CHECK (fitness_goal IN ('muscle_gain', 'fat_loss', 'endurance'));
```

## Phase 12 Complete

All three CALC requirements satisfied:
- **CALC-01** — Users can enter height, weight, and fitness goal on settings page
- **CALC-02** — Product pages display personalized dosage ranges based on user profile
- **CALC-03** — Non-dismissable ISSN safety disclaimer always visible on calculator output

---
*Phase: 12-profile-dosage-calculator*
*Completed: 2026-03-24*
