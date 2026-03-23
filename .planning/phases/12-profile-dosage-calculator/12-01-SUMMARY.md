---
phase: 12-profile-dosage-calculator
plan: "01"
subsystem: ui, database
tags: [dosage-calculator, body-stats, issn, supplements, profile-settings]

requires:
  - phase: 10-product-page-upgrade
    provides: product page with nutrition switcher and label modal
provides:
  - Body stats fields (height_cm, weight_kg, fitness_goal) on user profiles
  - Personalized dosage calculator on product pages with ISSN citations
  - Non-dismissable safety disclaimer on all calculator outputs
affects: []

tech-stack:
  added: []
  patterns:
    - ISSN-cited dosage ranges for caffeine, citrulline, beta-alanine
    - Body-weight-based dosage scaling with goal-specific adjustments

key-files:
  created:
    - src/lib/dosage.ts
    - src/app/products/[slug]/DosageCalculator.tsx
  modified:
    - src/lib/types.ts
    - src/lib/constants.ts
    - src/app/settings/page.tsx
    - src/app/products/[slug]/page.tsx

key-decisions:
  - "Body stats fields nullable for progressive profile completion"
  - "Caffeine dosage scaled by body weight (3-6 mg/kg) per ISSN position stand"
  - "Citrulline and beta-alanine use fixed daily ranges per ISSN (not weight-based)"
  - "Fitness goal adjusts dosage ceilings (endurance = higher caffeine, fat loss = moderate)"
  - "Calculator requires weight_kg AND fitness_goal to render — height_cm optional for future use"

patterns-established:
  - "ISSN citations on every dosage range for transparency and liability"
  - "Separate dosage logic module (dosage.ts) for testability"

requirements-completed: [CALC-01, CALC-02, CALC-03]

duration: 3min
completed: 2026-03-23
---

# Phase 12 Plan 01: Profile Body Stats & Dosage Calculator Summary

**Personalized ISSN-cited supplement dosage calculator on product pages driven by user body stats (height, weight, fitness goal) saved in profile settings**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-23T19:23:18Z
- **Completed:** 2026-03-23T19:26:38Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Body stats section on settings page with height (cm), weight (kg), and fitness goal selector with validation
- Dosage calculation engine with ISSN-cited safe ranges for caffeine, citrulline, and beta-alanine
- Product page dosage calculator showing personalized serving recommendations
- Non-dismissable safety disclaimer on all calculator outputs
- Graceful fallbacks: login prompt for guests, profile setup prompt for users without body stats

## Task Commits

Each task was committed atomically:

1. **Task 1: Add body stats fields to User type and settings form** - `692edcc` (feat)
2. **Task 2: Create dosage calculator component for product pages** - `bc2b76f` (feat)

## Files Created/Modified
- `src/lib/types.ts` - Added FitnessGoal type, height_cm, weight_kg, fitness_goal to User interface
- `src/lib/constants.ts` - Added FITNESS_GOALS constant array
- `src/lib/dosage.ts` - Dosage calculation logic with ISSN-cited ranges
- `src/app/settings/page.tsx` - Added body stats section with form, validation, and save
- `src/app/products/[slug]/DosageCalculator.tsx` - Client component for personalized dosage display
- `src/app/products/[slug]/page.tsx` - Integrated DosageCalculator between nutrition and label sections

## Decisions Made
- Body stats fields are nullable so users can progressively complete their profile
- Caffeine dose is weight-based (3-6 mg/kg) while citrulline (6-8g) and beta-alanine (3.2-6.4g) use fixed daily ranges — all per ISSN position stands
- Fitness goal adjusts dosage ceilings: endurance gets higher caffeine ceiling, fat loss gets moderate range
- Calculator requires both weight_kg AND fitness_goal to render; height_cm is captured but not currently used (future feature potential)
- Safety disclaimer is always visible and cannot be dismissed — yellow "SAFETY DISCLAIMER" header for visual prominence

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Database migration required: Add `height_cm` (numeric, nullable), `weight_kg` (numeric, nullable), and `fitness_goal` (text, nullable) columns to the `users` table in Supabase.

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm numeric;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg numeric;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fitness_goal text;
```

## Next Phase Readiness
- Phase 12 (Profile & Dosage Calculator) is complete
- All v1.1 feature phases are now implemented
- Dosage calculator is ready to display data once products have caffeine/citrulline/beta-alanine values populated

---
*Phase: 12-profile-dosage-calculator*
*Completed: 2026-03-23*
