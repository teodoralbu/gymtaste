# Feature Research

**Domain:** Gym supplement review platform (social + product review hybrid)
**Researched:** 2026-03-21
**Confidence:** MEDIUM (training data for UX patterns, HIGH for supplement dosing from established research)

## Feature Landscape

### Table Stakes (Users Expect These)

Features that users of a review/social app assume exist. Missing these makes the product feel broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Comment edit/delete | Every social app has this. Users panic when they can't fix a typo. | LOW | Add `updated_at` column, show "edited" tag when `updated_at > created_at`. Only allow author to edit/delete. Soft-delete (set `deleted_at`) is safer than hard delete for moderation. |
| "Edited" marker on comments | Instagram, Reddit, Discord all show this. Users distrust edits without transparency. | LOW | Simple conditional render: `updated_at !== created_at` shows "(edited)" next to timestamp. |
| Notification feed for likes/follows | Already partially built. Users expect to know when someone interacts with their content. | LOW | Existing `/notifications` page already aggregates likes, comments, follows. Needs: unread badge count, read/unread state. |
| Unread notification badge | Red dot/count on nav bell icon. Every social app has this. Without it, users never check notifications. | MEDIUM | Requires either polling, Supabase Realtime subscription, or server-side count on page load. A `last_read_at` timestamp on users table is simplest. |
| Multi-dimension rating display | If you collect flavor/pump/energy scores, users expect to SEE them on reviews (not just overall). | LOW | Already stored in `scores` JSON field. Need to render breakdown bars on feed cards and flavor pages. |
| Price display on product page | Products already have `price_per_serving` in DB. Users shopping for supplements expect price visibility. | LOW | Already partially shown in specs section. Enhance with value score. |
| Followers/following lists on profiles | Users who follow/are followed expect to see the list. Standard social feature. | MEDIUM | Query `follows` table filtered by `follower_id` or `following_id`, paginated. Link to user profiles. |

### Differentiators (Competitive Advantage)

Features that set GymTaste apart from generic review apps (Amazon reviews, Trustpilot) and other supplement apps.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Threaded comment replies (Instagram-style) | Creates conversation, not just "nice review." Drives engagement and return visits. | MEDIUM | Add `parent_id` nullable FK on `review_comments`. Display as flat list with indent for replies (one level deep only, like Instagram). Two-level max keeps UI clean on mobile. |
| Auto-calculated value score | No other supplement review app combines user ratings with price to compute $/quality. This is GymTaste's killer metric. | MEDIUM | Formula: `value_score = overall_score / price_per_serving`. Display as a badge/chip. Requires price data to be populated (admin or user-submitted). |
| Per-quantity nutritional slider | Lets users compare "per scoop" vs "per serving" vs "per 100g" -- mirrors how serious lifters think about dosing. | MEDIUM | Client-side math only. Store base values (per serving), compute per-scoop and per-100g with known serving weight. Needs `serving_size_g` field on products. |
| Supplement dosage calculator | No mainstream review app tells you "based on your weight, you need X scoops." This bridges the gap between review and utility. | HIGH | Requires: user profile fields (height_cm, weight_kg, goal), dosing formulas per ingredient, safety disclaimers. See detailed spec below. |
| Category-swipeable leaderboard | "Best flavor" vs "best pump" vs "best value" lets users find products by what matters to THEM, not just overall score. | MEDIUM | Filter existing leaderboard query by dimension. Swipeable tabs (horizontal scroll or tab bar). Each tab re-sorts by that dimension's average. |
| Product hero image + label viewer | Large product image with tap-to-zoom nutritional label feels premium. Most supplement sites have terrible product pages. | MEDIUM | Hero: larger image container with object-fit cover. Label: modal/bottom-sheet with zoomable image. Requires `label_image_url` field on products. |
| Leaderboard by product type | "Best pre-workout" vs "best protein" -- users browse by category. Current leaderboard is all-in-one. | LOW | Already have `category_id` on products. Add category filter tabs to leaderboard page. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time notifications (WebSocket) | "I want instant notifications like WhatsApp" | Massive complexity for a review app. Supabase Realtime adds connection overhead. Users don't need instant alerts for likes. | Poll on page load OR check `last_read_at` on navigation. SSR the count. Sufficient for review app cadence. |
| Nested comment threads (Reddit-style, unlimited depth) | "Let people reply to replies" | Deep nesting is unusable on mobile. Creates moderation nightmares. Fragments conversations. | One level of replies only (Instagram model). Parent comment + flat replies beneath it. |
| User-submitted dosage recommendations | "Let the community suggest doses" | Liability nightmare. Unqualified advice about caffeine/stimulant intake could cause harm. | Calculator uses only published research ranges. Community can share their personal experience in reviews, not as dosing advice. |
| Supplement stacking calculator | "Tell me what to combine" | Interaction effects between supplements are complex and poorly studied. Creates medical liability. | Show individual ingredient dosing only. Add disclaimer: "consult a healthcare provider for stacking." |
| Push notifications | "Notify me on my phone" | Requires service worker, push API registration, notification permission flows. High effort, low impact for a young product. | In-app notification feed with unread badge is sufficient for v1.1. Push is a v2+ feature after user base grows. |
| AI-powered review summaries | "Summarize what people think" | Adds API costs, introduces hallucination risk on health-related content, requires ongoing maintenance. | Aggregate scores by dimension already tell the story. "87% would buy again" is clearer than an AI summary. |
| Infinite edit window on comments | "Let me edit my comment anytime" | Old comments being silently rewritten breaks conversation context | Allow edits within 15 minutes of posting. After that, delete-and-repost only. |

## Feature Dependencies

```
[Rating system overhaul (new dimensions)]
    |
    +---> [Leaderboard by category] (needs per-dimension averages to sort)
    |
    +---> [Value score] (needs price_per_serving + overall_score)
    |
    +---> [Multi-dimension display on feed/cards] (needs scores JSON populated)

[Comment edit/delete]
    |
    +---> [Threaded replies] (build on updated comment model)

[User profile fields (height, weight, goal)]
    |
    +---> [Supplement dosage calculator] (needs body metrics)

[Product page overhaul]
    |
    +---> [Hero image] (needs product image_url, already exists)
    |
    +---> [Nutritional label viewer] (needs label_image_url, NEW field)
    |
    +---> [Per-quantity slider] (needs serving_size_g, NEW field)

[Notification improvements]
    |
    +---> [Unread badge] (needs last_read_at on users)
    |
    +---> [Followers/following list] (independent, uses existing follows table)
```

### Dependency Notes

- **Leaderboard by category requires rating overhaul:** Can't sort by "best pump" if the `pump` score isn't being collected in the new dimension system. The existing 5 sliders (taste, sweetness, pump, energy, intensity) already capture this -- but the leaderboard query needs to aggregate per-dimension instead of just `overall_score`.
- **Value score requires price data:** `price_per_serving` already exists in the DB schema but may not be populated for all products. Admin needs a way to bulk-enter prices, or users submit prices with reviews.
- **Dosage calculator requires profile fields:** Users table needs `height_cm`, `weight_kg`, `fitness_goal` (enum: muscle_gain, fat_loss, endurance, general_health). These feed the calculator formulas.
- **Comment threading requires comment model update:** Add `parent_id` to `review_comments` before building reply UI. Edit/delete should ship first since it touches the same component.
- **Per-quantity slider requires serving weight:** Need `serving_size_g` on products table to calculate per-100g values. Without it, can only show "per serving" (which is what's already there).

## Supplement Dosage Calculator -- Detailed Spec

### Inputs Required

| Input | Type | Notes |
|-------|------|-------|
| Body weight | number (kg) | Convert from lbs if user prefers imperial. Store as kg. |
| Height | number (cm) | Optional for most calculations, but useful for BMI-adjusted dosing. |
| Fitness goal | enum | `muscle_gain`, `fat_loss`, `endurance`, `general_health` |
| Caffeine sensitivity | enum | `low`, `normal`, `high` -- affects caffeine recommendation |

### Safe Dosing Ranges (Evidence-Based)

These ranges are drawn from established sports nutrition research (ISSN position stands, examine.com meta-analyses). Confidence: HIGH for these specific ingredients.

#### Caffeine
- **Effective dose:** 3-6 mg/kg body weight (performance benefit)
- **Safe daily max:** 400 mg/day (FDA general guidance)
- **Pre-workout timing:** 30-60 minutes before exercise
- **Goal adjustment:** Endurance athletes may benefit from higher end (5-6 mg/kg). Fat loss: 3-4 mg/kg sufficient for thermogenic effect.
- **Sensitivity adjustment:** High sensitivity users: cap at 200 mg regardless of weight. Normal: full range. Low sensitivity (habitual users): note that tolerance reduces effect, not that they should take more.
- **Warning thresholds:** Flag if calculated dose exceeds 400 mg. Hard cap recommendation at 600 mg regardless of body weight.
- **Example:** 80 kg user, normal sensitivity, muscle gain = 240-480 mg recommended. "Your pre-workout contains 300 mg -- this is within your effective range."

#### L-Citrulline
- **Effective dose:** 6-8 g/day (as L-citrulline, not citrulline malate)
- **Citrulline malate:** 8-10 g/day (the malate portion is ~40% of weight)
- **Not body-weight dependent:** Flat dose range for all adults.
- **Goal adjustment:** Pump-focused (muscle gain): aim for 8g. Endurance: 6g sufficient.
- **No upper safety concern** at supplemental doses up to 15g/day in studies.
- **Example:** "Your pre-workout contains 4g citrulline. For optimal pump, consider a product with 6-8g, or add standalone citrulline."

#### Beta-Alanine
- **Effective dose:** 3.2-6.4 g/day (chronic loading, not acute)
- **Loading protocol:** 3.2 g/day for 4+ weeks to saturate muscle carnosine
- **Not body-weight dependent:** Flat dose.
- **Paresthesia (tingling):** Normal at doses above 800 mg per single serving. Not harmful. Can split into smaller doses throughout day to minimize.
- **Goal adjustment:** All goals benefit similarly. Endurance athletes see slightly more benefit.
- **Example:** "Your pre-workout has 3.2g beta-alanine per serving. This meets the minimum effective dose for carnosine loading."

#### Creatine Monohydrate
- **Maintenance dose:** 3-5 g/day (consensus across all major sports nutrition bodies)
- **Loading protocol (optional):** 20 g/day for 5-7 days, then 3-5 g/day maintenance
- **Body-weight adjusted:** Some research supports 0.03-0.05 g/kg/day for maintenance
- **Not timing-dependent:** Can take any time of day. Post-workout may have slight absorption benefit.
- **Goal adjustment:** Muscle gain: 5g/day. General health: 3g/day. Fat loss: 3-5g/day (preserves lean mass).
- **Hydration note:** Increase water intake by ~500 mL/day when supplementing creatine.
- **Example:** 80 kg user = 2.4-4.0 g/day by weight, round to 3-5g recommendation.

### Calculator Output Format

For each ingredient in the selected product:
1. **Your dose:** What the product gives you per serving
2. **Recommended range:** Based on weight + goal
3. **Status:** Under-dosed / Effective / Over-dosed (with color coding)
4. **Note:** Any relevant context (e.g., "Split into 2 servings to reduce tingling")

### Safety Disclaimers (REQUIRED)

Must display prominently:
- "This calculator provides general guidance based on published research. It is not medical advice."
- "Consult a healthcare provider before starting any supplement regimen."
- "If you are pregnant, nursing, under 18, or taking medication, consult your doctor."
- "Individual responses to supplements vary. Start with the lower end of recommended ranges."
- Link to sources (ISSN, FDA caffeine guidance)

### UI Recommendation

- Place calculator on product page (contextual: "How much of THIS product should I take?")
- Require profile setup first (height/weight/goal) -- prompt from product page if not set
- Show results as a simple card per ingredient with a progress bar (dose vs recommended range)
- Color code: green (in range), yellow (slightly under/over), red (significantly over)

## MVP Definition

### Launch With (v1.1 Core)

- [ ] **Rating system overhaul** -- new dimension schema is the foundation for leaderboard categories and value score. Everything else builds on this.
- [ ] **Comment edit/delete with "edited" marker** -- table stakes, low effort, high trust signal
- [ ] **Comment threading (one level)** -- meaningful engagement upgrade, medium effort
- [ ] **Notification unread badge + read state** -- existing notifications page works but users never check it without a badge
- [ ] **Followers/following list on profiles** -- table stakes for social features
- [ ] **Product page hero image** -- low effort visual upgrade (image already exists in DB)
- [ ] **Leaderboard category tabs** -- leverage new rating dimensions, use existing query pattern

### Add After Validation (v1.1 Extended)

- [ ] **Value score (auto-calculated)** -- add once price data is populated for enough products
- [ ] **Per-quantity nutritional slider** -- add once `serving_size_g` is populated
- [ ] **Nutritional label image viewer** -- add once label images are being uploaded
- [ ] **Supplement dosage calculator** -- add once user profile fields are in place and the ingredient reference data is solid

### Future Consideration (v2+)

- [ ] **Push notifications** -- only after user base demonstrates notification engagement
- [ ] **AI review summaries** -- only after scale justifies the cost
- [ ] **Supplement stacking advice** -- requires deeper research partnership or expert review board

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Depends On |
|---------|------------|---------------------|----------|------------|
| Rating system overhaul | HIGH | MEDIUM | P1 | Nothing (foundation) |
| Comment edit/delete | HIGH | LOW | P1 | Nothing |
| Notification unread badge | HIGH | LOW | P1 | `last_read_at` column |
| Followers/following list | MEDIUM | LOW | P1 | Existing follows table |
| Comment threading | MEDIUM | MEDIUM | P1 | Comment model update |
| Product page hero image | MEDIUM | LOW | P1 | Existing image_url |
| Leaderboard category tabs | HIGH | MEDIUM | P1 | Rating overhaul |
| Value score | HIGH | LOW | P2 | Price data populated |
| Per-quantity slider | MEDIUM | MEDIUM | P2 | serving_size_g field |
| Label image viewer | LOW | MEDIUM | P2 | label_image_url field |
| Dosage calculator | HIGH | HIGH | P2 | Profile fields + reference data |
| Leaderboard swipe UX | MEDIUM | LOW | P2 | Category tabs working |

**Priority key:**
- P1: Must have for v1.1 launch -- these define the milestone
- P2: Should have, add in v1.1 if time permits or immediately after
- P3: Future consideration

## Competitor Feature Analysis

| Feature | Supplement Review Apps (Labdoor, Examine) | Social Review Apps (Vivino, Untappd) | Amazon Reviews | GymTaste Approach |
|---------|-------------------------------------------|--------------------------------------|----------------|-------------------|
| Multi-dimension ratings | Labdoor: lab-tested scores (purity, value, efficacy). Users don't rate. | Vivino: single 5-star. Untappd: single 5-point. | Single 5-star | 5 user-rated dimensions with weighted overall. More granular than social apps, more democratic than Labdoor. |
| Threaded comments | None (no social layer) | Untappd: flat comments only. Vivino: flat. | Nested but terrible UX | Instagram-style single-level replies. Clean on mobile. |
| Value scoring | Labdoor: calculates value but from lab data, not user sentiment | Not applicable | No value metric | Auto-calculated from user ratings + price. Unique combination. |
| Dosage calculator | Examine.com has ingredient pages but no personalized calculator | Not applicable | Not applicable | Personalized by body weight + goal. Contextual to the product being viewed. |
| Notification feed | Not applicable | Untappd: basic (likes, comments, toasts) | Not applicable | Like/comment/follow notifications with unread state. |
| Product nutrition display | Labdoor: full lab-tested nutrition panels | Not applicable | Seller-uploaded images | Per-quantity slider (scoop/serving/100g) is differentiated. |
| Category leaderboards | Labdoor: ranks by category (pre-workout, protein) but single dimension | Untappd: top-rated by style | Not applicable | Multi-dimension category leaderboards (best pump pre-workout, best flavor protein). |

## Sources

- Supplement dosing ranges: Based on ISSN (International Society of Sports Nutrition) position stands on caffeine (2021), creatine (2017, updated 2021), beta-alanine (2015), and citrulline (various meta-analyses). Confidence: HIGH -- these are well-established ranges cited across sports nutrition literature.
- FDA caffeine guidance: 400mg/day general recommendation for healthy adults. Confidence: HIGH.
- UX patterns (threaded comments, notification feeds, leaderboard tabs): Based on analysis of Instagram, Reddit, Untappd, and Vivino implementations. Confidence: MEDIUM -- training data, not verified against current versions.
- Competitor feature sets (Labdoor, Examine, Untappd, Vivino): Based on training data knowledge of these platforms. Confidence: MEDIUM -- features may have changed since training cutoff.

---
*Feature research for: GymTaste v1.1 Feature Expansion*
*Researched: 2026-03-21*
