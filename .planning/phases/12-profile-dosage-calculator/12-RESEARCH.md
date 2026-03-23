# Phase 12: Profile & Dosage Calculator - Research

**Researched:** 2026-03-23
**Domain:** User profile body stats, supplement dosage calculation, safety disclaimers
**Confidence:** HIGH

## Summary

Phase 12 adds three new columns to the `users` table (height_cm, weight_kg, fitness_goal), extends the settings page with a "Body Stats" section, and renders a personalized dosage recommendation card on product pages. The dosage logic is pure arithmetic based on ISSN-referenced safe ranges for caffeine, citrulline, and beta-alanine -- the three ingredients already stored on products.

The product page is a server component (`revalidate = 300`), so the dosage card must be a client component that reads profile data from `useAuth()`. When no profile data exists, the card shows a CTA linking to settings. The safety disclaimer is non-dismissable (always visible, not in a toast or closeable banner).

**Primary recommendation:** Add columns to `users` table, extend the User type and settings form, create a `DosageCard` client component embedded in the product page.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CALC-01 | User can enter height, weight, and fitness goal on their profile settings | New DB columns on `users` table; new section in settings page form using existing `Input` component and a select for fitness_goal |
| CALC-02 | Product pages show a dosage recommendation based on user's profile | Client component `DosageCard` on product page; reads `useAuth().profile` for weight; uses product's `caffeine_mg`, `citrulline_g`, `beta_alanine_g` to compute ranges |
| CALC-03 | Calculator includes a safety disclaimer citing recommended safe ranges | Static disclaimer text referencing ISSN position stands; rendered inline (non-dismissable) below dosage output |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App framework | Already in use |
| React | 19.2.3 | UI | Already in use |
| Supabase JS | 2.99.1 | Database client | Already in use |
| Tailwind CSS | 4.x | Styling | Already in use |

### Supporting
No new dependencies needed. All dosage calculation is pure TypeScript arithmetic. No charting, no external API calls.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side dosage calc | Server-side calc with API route | Unnecessary complexity; product data is already on page, profile is in auth context |
| Separate calculator page | Inline card on product page | Requirements explicitly say "product pages display a dosage recommendation" |

## Architecture Patterns

### Where Things Go

```
src/
  app/
    settings/page.tsx          # MODIFY - add Body Stats section
    products/[slug]/
      page.tsx                 # MODIFY - add DosageCard below specs
      DosageCard.tsx           # NEW - client component for personalized dosage
  lib/
    types.ts                   # MODIFY - add height_cm, weight_kg, fitness_goal to User
    constants.ts               # MODIFY - add FITNESS_GOALS, DOSAGE_RANGES
    dosage.ts                  # NEW - pure functions for dosage calculation
```

### Pattern 1: Body Stats on Settings Page
**What:** Add a new section between "Profile" and "Badge" sections on settings page
**When to use:** Follows existing section pattern with `h2` header, form inputs, save button
**Example:**
```typescript
// New section in settings/page.tsx, follows existing form pattern
// Height: number input (cm)
// Weight: number input (kg)
// Fitness goal: select with 3 options (muscle_gain / fat_loss / endurance)
// Save triggers supabase.from('users').update({ height_cm, weight_kg, fitness_goal })
// Then calls refreshProfile() to update auth context
```

### Pattern 2: DosageCard Client Component
**What:** A `'use client'` component that reads profile from auth context and product data from props
**When to use:** On product pages, below the specs section
**Example:**
```typescript
// DosageCard receives product ingredient data as props (server-rendered)
// Reads user profile from useAuth() (client-side)
// If profile has weight_kg: compute and display dosage ranges
// If no profile/weight: show CTA "Add your body stats in Settings"
// Always shows disclaimer at bottom (non-dismissable)
'use client'
import { useAuth } from '@/context/auth-context'

interface DosageCardProps {
  caffeineMg: number | null
  citrullineG: number | null
  betaAlanineG: number | null
  servingsPerContainer: number | null
}
```

### Pattern 3: Pure Dosage Functions
**What:** Stateless functions in `lib/dosage.ts` for testable calculation logic
**When to use:** Keeps business logic out of components
**Example:**
```typescript
// lib/dosage.ts
export type FitnessGoal = 'muscle_gain' | 'fat_loss' | 'endurance'

export interface DosageResult {
  ingredientName: string
  productAmountPerServing: number
  unit: string
  recommendedRange: { min: number; max: number }
  withinRange: boolean
  note: string
}

export function calculateDosages(
  weightKg: number,
  goal: FitnessGoal,
  product: { caffeineMg: number | null; citrullineG: number | null; betaAlanineG: number | null }
): DosageResult[]
```

### Anti-Patterns to Avoid
- **Storing dosage results in the database:** These are derived values; compute on-the-fly from weight + product specs
- **Making the disclaimer dismissable:** Requirements say non-dismissable; no close button, no localStorage flag
- **Prescriptive medical language:** Use "recommended range" and "general guidance", never "you should take" or "prescribed dose"

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unit conversion (lb/kg) | Custom conversion logic | Simple constant (1 lb = 0.453592 kg) stored in constants | Trivial math, but store the constant to avoid magic numbers |
| Form validation | Custom validator | HTML5 `min`/`max`/`required` attributes on `<Input>` | Existing pattern in codebase; sufficient for numeric inputs |

**Key insight:** The dosage calculator is pure arithmetic, not a complex system. The main engineering work is UI integration, not calculation logic.

## Common Pitfalls

### Pitfall 1: Forgetting to update the User type everywhere
**What goes wrong:** Adding columns to DB but not updating `User` interface in `types.ts` and the `Database` type
**Why it happens:** The `Database` type in `types.ts` manually mirrors the schema
**How to avoid:** Update `User` interface, `Database.public.Tables.users` Row/Insert/Update types simultaneously
**Warning signs:** TypeScript errors on profile access, or silent `undefined` on new fields

### Pitfall 2: Server component trying to use auth context
**What goes wrong:** Product page is a server component; can't call `useAuth()` there
**Why it happens:** Developer puts dosage logic directly in the product page
**How to avoid:** DosageCard must be a separate `'use client'` component; pass product data as props from the server component
**Warning signs:** "useContext is not a function" or hydration errors

### Pitfall 3: Displaying dosage when product has no ingredient data
**What goes wrong:** Showing "0mg caffeine" or NaN calculations when product columns are null
**Why it happens:** Not all products have caffeine_mg/citrulline_g/beta_alanine_g populated
**How to avoid:** Only show dosage rows for non-null ingredients; if all three are null, hide DosageCard entirely
**Warning signs:** Empty or zero-value dosage displays

### Pitfall 4: Using weight in pounds without conversion
**What goes wrong:** ISSN ranges are in mg/kg; if weight is stored in lbs, calculations are wrong by 2.2x
**Why it happens:** Users in the US think in pounds
**How to avoid:** Store canonical weight in kg; optionally provide lb/kg toggle in the UI, but convert before storage
**Warning signs:** Dosage ranges that seem impossibly high or low

### Pitfall 5: Disclaimer not visible without scrolling
**What goes wrong:** Safety disclaimer rendered far below dosage output, user never sees it
**Why it happens:** Long product pages push content down
**How to avoid:** Render disclaimer as part of the DosageCard component itself, directly below the dosage table, with a visible warning icon/color
**Warning signs:** Disclaimer not visible on initial render of the card

## Code Examples

### Dosage Calculation Logic
```typescript
// lib/dosage.ts
// ISSN Position Stand references:
// Caffeine: 3-6 mg/kg body weight (Guest et al., 2021, JISSN)
// Beta-alanine: 3.2-6.4 g/day (Trexler et al., 2015, JISSN)
// Citrulline: 6-8 g/day (not body-weight dependent)

export const DOSAGE_RANGES = {
  caffeine: {
    // mg per kg body weight
    minPerKg: 3,
    maxPerKg: 6,
    absoluteMax: 400, // FDA general daily limit
    unit: 'mg',
    source: 'ISSN Position Stand: Caffeine and Exercise Performance (2021)',
  },
  beta_alanine: {
    // grams per day (not weight-dependent)
    min: 3.2,
    max: 6.4,
    unit: 'g',
    source: 'ISSN Position Stand: Beta-Alanine (2015)',
  },
  citrulline: {
    // grams per day (not weight-dependent)
    min: 6,
    max: 8,
    unit: 'g',
    source: 'ISSN Position Stand: Pre-Exercise Nutrition',
  },
} as const
```

### Fitness Goal Modifiers
```typescript
// Goal affects caffeine recommendation within ISSN range:
// - muscle_gain: lower end (3-4 mg/kg) -- focus on pump not stimulation
// - fat_loss: mid-high (4-6 mg/kg) -- thermogenic benefit
// - endurance: full range (3-6 mg/kg) -- well-studied for endurance
const GOAL_CAFFEINE_MODIFIER: Record<FitnessGoal, { min: number; max: number }> = {
  muscle_gain: { min: 3, max: 4 },
  fat_loss: { min: 4, max: 6 },
  endurance: { min: 3, max: 6 },
}
```

### Settings Form Body Stats Section
```typescript
// Follows existing section pattern in settings/page.tsx
// New state fields in form:
{
  height_cm: profile?.height_cm?.toString() ?? '',
  weight_kg: profile?.weight_kg?.toString() ?? '',
  fitness_goal: profile?.fitness_goal ?? '',
}
// Save includes: height_cm: Number(form.height_cm) || null, weight_kg: Number(form.weight_kg) || null
```

### Safety Disclaimer Component
```typescript
// Always rendered inside DosageCard, never dismissable
<div style={{
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '12px 16px',
  marginTop: '12px',
}}>
  <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.5 }}>
    <strong style={{ color: 'var(--text-muted)' }}>Disclaimer:</strong> These ranges are
    general guidance based on ISSN position stands and are not medical advice. Individual
    tolerance varies. Consult a healthcare professional before starting any supplement regimen.
    Do not exceed manufacturer-recommended serving sizes.
  </p>
</div>
```

## DB Migration

### New Columns on `users` Table
```sql
ALTER TABLE users ADD COLUMN height_cm SMALLINT;
ALTER TABLE users ADD COLUMN weight_kg NUMERIC(5,1);
ALTER TABLE users ADD COLUMN fitness_goal TEXT CHECK (fitness_goal IN ('muscle_gain', 'fat_loss', 'endurance'));
```

**Design decisions:**
- `height_cm` as SMALLINT: sufficient range (50-300cm), integer precision adequate
- `weight_kg` as NUMERIC(5,1): allows one decimal (e.g., 82.5kg), range up to 9999.9
- `fitness_goal` as TEXT with CHECK constraint: matches existing pattern (no new enum needed for 3 values)
- All nullable: user can use the app without providing body stats
- No separate table: these are direct user attributes, not a separate entity

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic "one size fits all" dosage on label | Weight-based dosing per ISSN | ISSN caffeine position stand updated 2021 | Personalized ranges based on body weight |

**ISSN references used:**
- Caffeine: Guest et al. (2021) "International society of sports nutrition position stand: caffeine and exercise performance" - 3-6 mg/kg
- Beta-alanine: Trexler et al. (2015) "International society of sports nutrition position stand: Beta-Alanine" - 3.2-6.4 g/day
- Citrulline: Literature consensus 6-8 g/day L-citrulline for performance benefit

## Open Questions

1. **Unit preference (metric vs imperial)**
   - What we know: ISSN ranges use kg; dosage math requires kg
   - What's unclear: Should UI show lb/ft toggle or just metric?
   - Recommendation: Store in metric (canonical), show a small lb/kg toggle on the input for user convenience. Keep it simple -- just multiply/divide by 2.205 on display.

2. **Height usage**
   - What we know: Requirements say "enter height, weight, and fitness goal"
   - What's unclear: Height is not used in any ISSN dosage formula (all are weight-based or flat ranges)
   - Recommendation: Collect height as required by spec, display it on profile. It could be useful for future BMI-based features but is not needed for current dosage calculations.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None currently installed (zero test coverage, noted in STATE.md) |
| Config file | none -- see Wave 0 |
| Quick run command | `npx vitest run src/lib/dosage.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CALC-01 | Body stats saved to profile | manual | N/A (Supabase integration) | N/A |
| CALC-02 | Dosage calculation from weight + product data | unit | `npx vitest run src/lib/dosage.test.ts` | Wave 0 |
| CALC-03 | Safety disclaimer always visible | manual | N/A (visual check) | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/dosage.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest` dev dependency: `npm install -D vitest` -- no test framework currently installed
- [ ] `src/lib/dosage.test.ts` -- unit tests for calculateDosages function covering all three ingredients, edge cases (null ingredients, zero weight), and goal modifiers
- [ ] `vitest.config.ts` -- minimal config for TypeScript path aliases

**Note from STATE.md:** "Zero test coverage -- accepted risk, calculator (Phase 12) is the exception." This phase is explicitly called out as needing tests.

## Sources

### Primary (HIGH confidence)
- ISSN Caffeine Position Stand (2021): https://pmc.ncbi.nlm.nih.gov/articles/PMC7777221/ - 3-6 mg/kg body weight
- ISSN Beta-Alanine Position Stand: https://pubmed.ncbi.nlm.nih.gov/26175657/ - 3.2-6.4 g/day
- Codebase inspection: `src/lib/types.ts`, `src/app/settings/page.tsx`, `src/app/products/[slug]/page.tsx`, `src/context/auth-context.tsx`

### Secondary (MEDIUM confidence)
- Citrulline dosing 6-8g/day: consensus from multiple supplement research reviews (not a single ISSN position stand)
- SETFORSET ISSN summary: https://www.setforset.com/blogs/news/issn-position-stands-supplements-nutrition

### Tertiary (LOW confidence)
- Height's future utility for BMI-based features: speculation, not requirement-driven

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all existing tech
- Architecture: HIGH - follows established patterns (client component in server page, settings form sections, auth context)
- Pitfalls: HIGH - based on direct codebase inspection (server/client boundary, null product data)
- Dosage ranges: MEDIUM - ISSN caffeine is well-documented; citrulline range from literature consensus, not single ISSN stand

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable domain, ISSN positions rarely change)
