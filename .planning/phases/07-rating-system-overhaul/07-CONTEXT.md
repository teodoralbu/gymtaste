# Phase 7: Rating System Overhaul - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the 5 old rating dimensions (taste/sweetness/pump/energy/intensity) with 3 new ones (Flavor, Pump, Energy & Focus), add optional price capture during submission, auto-calculate a value score, and hide all pre-v1.1 reviews across feeds, product pages, and leaderboards. No new UI surfaces — this is a schema + form + display overhaul.

</domain>

<decisions>
## Implementation Decisions

### Rating dimensions
- 3 new dimensions: **Flavor**, **Pump**, **Energy & Focus** (exact labels)
- Equal weight: Flavor ×0.33, Pump ×0.33, Energy & Focus ×0.34
- Slider range: 1–10, step 0.5 (unchanged from current)
- Overall score = weighted average of the 3 new dimensions
- Update `RATING_DIMENSIONS` in `src/lib/constants.ts` — remove taste/sweetness/intensity entries, add flavor/pump/energy_focus with equal weights

### Price capture
- User enters **price per container** (what they paid for the whole tub)
- Field is **optional** — reviews without price just don't get a value score
- Currency: **USD ($)** — display `$` prefix on the input, store as plain decimal
- No currency selector — single currency for now
- If `servings_per_container` is null on the product, value score cannot be calculated even with price entered

### Value score
- Formula: `value_score = (overall_score / price_per_serving) normalized to 1–10`
- `price_per_serving` = user-entered container price ÷ product's `servings_per_container`
- Normalization range: define min/max empirically (e.g. $0.50–$3.00/serving as the realistic range for pre-workouts) — Claude decides exact normalization bounds
- Value score stored on the rating row (not computed on the fly)
- **Display**: 4th pill in the expanded review card, after Flavor/Pump/Energy & Focus pills — only rendered when value score is present. Label: "Value"

### Schema versioning & old review handling
- Add a `schema_version` column to the `ratings` table (integer, default 1 for old, 2 for new)
- New ratings submitted via this phase write `schema_version = 2`
- Old reviews (schema_version = 1 or null) are **hidden** from: feed, product flavor page reviews, leaderboard score calculations
- Old reviews are NOT deleted — they stay in the DB for data integrity
- **Badge tier / XP**: pre-v1.1 ratings (schema_version = 1) **still count** toward badge tier and XP — users earned those and removing them would be unfair. Only the display/feed visibility is gated.

### Claude's Discretion
- Exact normalization bounds for value score (e.g. what $0.50/serving and $3.00/serving map to on a 1–10 scale)
- Whether `schema_version` is a column on `ratings` or a separate versioning strategy
- How to handle null `servings_per_container` in the value score calculation (skip silently)
- RatingForm layout/ordering of the price input field within the form (suggested: after the dimension sliders, before "Would buy again?")

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core rating files
- `src/lib/constants.ts` — RATING_DIMENSIONS array (must be updated), getScoreColor thresholds, weight definitions
- `src/components/rating/RatingForm.tsx` — full rating submission form (add price field, update dimensions)
- `src/components/rating/ReviewCard.tsx` — expanded pill display (add value pill)

### DB schema context
- `src/lib/types.ts` — Product type has `price_per_serving` and `servings_per_container` fields; Rating type will need `price_paid`, `value_score`, `schema_version`
- `src/lib/queries.ts` — rating insert and feed queries (old reviews must be filtered by schema_version)

### Requirements
- `.planning/REQUIREMENTS.md` — RATE-01 through RATE-04 acceptance criteria

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getScoreColor(score)` in `constants.ts`: returns green/yellow/red based on 1–10 score — use for value score pill color too
- `SliderRow` component in `RatingForm.tsx`: memo'd slider row — reuse as-is for the 3 new dimensions
- `Section` component in `RatingForm.tsx`: card-surface wrapper — use for the new price input section
- Expanded pill pattern in `ReviewCard.tsx`: `RATING_DIMENSIONS.map(dim => ...)` — extend to include value score pill

### Established Patterns
- All slider scores stored in `scores` JSONB column as `{ flavor: 7.5, pump: 8.0, energy_focus: 6.5 }` — keep same pattern with new keys
- Overall score = `parseFloat(calcOverall(scores).toFixed(2))` written to `overall_score` column — same approach
- Inline styles with CSS variables throughout — no Tailwind classes in rating components

### Integration Points
- `src/lib/constants.ts` RATING_DIMENSIONS: update array here → changes propagate to RatingForm sliders AND ReviewCard pills
- Feed and product page queries in `src/lib/queries.ts`: add `.eq('schema_version', 2)` or `.neq('schema_version', 1)` filter to hide old reviews
- Leaderboard queries: same schema_version filter to exclude old rating data from score aggregations
- Supabase `ratings` table: migration needed to add `schema_version`, `price_paid`, `value_score` columns

</code_context>

<specifics>
## Specific Ideas

- Value score should only render the pill when `value_score` is non-null — don't show an empty or "N/A" pill
- Price input placeholder: `"e.g. 39.99"` with `$` prefix (no currency symbol inside the input, just a label prefix)
- The formula `quality ÷ cost_per_serving → normalized 1–10` captures the intuition: high quality + low cost = great value

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-rating-system-overhaul*
*Context gathered: 2026-03-22*
