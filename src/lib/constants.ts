export const RANK_TIERS = {
  newbie:   { name: 'Newbie',  min: 0,    max: 199,  color: '#808080' },
  gym_rat:  { name: 'Gym Rat', min: 200,  max: 999,  color: '#64B5F6' },
  athlete:  { name: 'Athlete', min: 1000, max: 2999, color: '#00E676' },
  beast:    { name: 'Beast',   min: 3000, max: 7999, color: '#FFD600' },
  legend:   { name: 'Legend',  min: 8000, max: Infinity, color: '#FF3D00' },
} as const

export type RankTier = keyof typeof RANK_TIERS

export function getRankFromXP(xp: number): RankTier {
  if (xp >= 8000) return 'legend'
  if (xp >= 3000) return 'beast'
  if (xp >= 1000) return 'athlete'
  if (xp >= 200)  return 'gym_rat'
  return 'newbie'
}

export const XP_VALUES = {
  rating:   50,
  progress: 30,
  pr:       40,
  checkin:  20,
  comment:  5,
  like_received: 2,
} as const

export const BADGE_TIERS = {
  fresh_meat: {
    name: 'Fresh Meat',
    min: 0,
    max: 2,
    color: '#808080',
    description: 'Just walked in.',
  },
  first_rep: {
    name: 'First Rep',
    min: 3,
    max: 9,
    color: '#64B5F6',
    description: 'Getting started.',
  },
  taster: {
    name: 'Taster',
    min: 10,
    max: 19,
    color: '#00B4FF',
    description: 'You have opinions.',
  },
  consistent: {
    name: 'Consistent',
    min: 20,
    max: 34,
    color: '#00E5CC',
    description: 'Showing up. Every time.',
  },
  flavor_hunter: {
    name: 'Flavor Hunter',
    min: 35,
    max: 54,
    color: '#00E676',
    description: 'On a mission.',
  },
  supplement_scholar: {
    name: 'Supplement Scholar',
    min: 55,
    max: 79,
    color: '#C6FF00',
    description: 'You actually know your stuff.',
  },
  connoisseur: {
    name: 'Connoisseur',
    min: 80,
    max: 119,
    color: '#FFD600',
    description: 'Refined taste. Earned.',
  },
  elite_palate: {
    name: 'Elite Palate',
    min: 120,
    max: 174,
    color: '#FF9100',
    description: 'Few reach this level.',
  },
  gym_rat: {
    name: 'Gym Rat',
    min: 175,
    max: 249,
    color: '#FF5722',
    description: 'This is your life.',
  },
  legend: {
    name: 'Legend',
    min: 250,
    max: Infinity,
    color: '#FF3D00',
    description: 'Undeniable.',
  },
} as const

export type BadgeTier = keyof typeof BADGE_TIERS

// Ordered array for progression display
export const BADGE_TIER_ORDER: BadgeTier[] = [
  'fresh_meat', 'first_rep', 'taster', 'consistent', 'flavor_hunter',
  'supplement_scholar', 'connoisseur', 'elite_palate', 'gym_rat', 'legend',
]

export function getBadgeTier(ratingCount: number): BadgeTier {
  if (ratingCount >= 250) return 'legend'
  if (ratingCount >= 175) return 'gym_rat'
  if (ratingCount >= 120) return 'elite_palate'
  if (ratingCount >= 80) return 'connoisseur'
  if (ratingCount >= 55) return 'supplement_scholar'
  if (ratingCount >= 35) return 'flavor_hunter'
  if (ratingCount >= 20) return 'consistent'
  if (ratingCount >= 10) return 'taster'
  if (ratingCount >= 3) return 'first_rep'
  return 'fresh_meat'
}

export const FITNESS_GOALS = [
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'endurance', label: 'Endurance' },
] as const

export const CONTEXT_TAGS = [
  // Workout type
  { value: 'leg_day',       label: 'Leg day' },
  { value: 'push_day',      label: 'Push day' },
  { value: 'pull_day',      label: 'Pull day' },
  { value: 'upper_body',    label: 'Upper body' },
  { value: 'cardio',        label: 'Cardio' },
  { value: 'full_body',     label: 'Full body' },
  // Timing
  { value: 'morning_session', label: 'Morning session' },
  { value: 'evening_session', label: 'Evening session' },
  { value: 'empty_stomach',   label: 'Empty stomach' },
  { value: 'after_meal',      label: 'After meal' },
  // Mix
  { value: 'mixed_with_water', label: 'Mixed with water' },
  { value: 'mixed_with_milk',  label: 'Mixed with milk' },
  { value: 'mixed_with_juice', label: 'Mixed with juice' },
] as const

export type ContextTag = (typeof CONTEXT_TAGS)[number]['value']

export const RATING_DIMENSIONS = [
  { key: 'flavor',       label: 'Flavor',         weight: 0.33 },
  { key: 'pump',         label: 'Pump',           weight: 0.33 },
  { key: 'energy_focus', label: 'Energy & Focus', weight: 0.34 },
] as const

export type RatingDimension = (typeof RATING_DIMENSIONS)[number]['key']

export const REPORT_REASONS = [
  { value: 'false_info', label: 'False information' },
  { value: 'spam', label: 'Spam' },
  { value: 'offensive', label: 'Offensive content' },
  { value: 'other', label: 'Other' },
] as const

export const MIN_RATINGS_FOR_LEADERBOARD = 5

export const MAX_RATINGS_PER_HOUR = 20
export const MAX_COMMENTS_PER_HOUR = 50

export const MAX_REVIEW_LENGTH = 280
export const MAX_BIO_LENGTH = 160
export const MAX_COMMENT_LENGTH = 280
export const MAX_REPORT_DESCRIPTION_LENGTH = 500

export const SCORE_COLORS = {
  high: '#00E676',   // 8.0+
  mid: '#FFD600',    // 6.0–7.9
  low: '#FF3D00',    // below 6.0
} as const

export function getScoreColor(score: number): string {
  if (score >= 8.0) return SCORE_COLORS.high
  if (score >= 6.0) return SCORE_COLORS.mid
  return SCORE_COLORS.low
}
