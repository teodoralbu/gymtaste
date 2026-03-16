import { BADGE_TIERS } from '@/lib/constants'
import type { BadgeTier } from '@/lib/types'

interface BadgeProps {
  tier: BadgeTier
  size?: 'sm' | 'md' | 'lg'
  showDot?: boolean
}

// Map BadgeTier values to BADGE_TIERS keys (they now match 1:1)
const TIER_MAP: Record<BadgeTier, keyof typeof BADGE_TIERS> = {
  fresh_meat: 'fresh_meat',
  first_rep: 'first_rep',
  taster: 'taster',
  consistent: 'consistent',
  flavor_hunter: 'flavor_hunter',
  supplement_scholar: 'supplement_scholar',
  connoisseur: 'connoisseur',
  elite_palate: 'elite_palate',
  gym_rat: 'gym_rat',
  legend: 'legend',
}

export function Badge({ tier, size = 'md', showDot = true }: BadgeProps) {
  const tierKey = TIER_MAP[tier] ?? 'fresh_meat'
  const tierData = BADGE_TIERS[tierKey]
  const color = tierData.color
  const name = tierData.name

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${sizes[size]}`}
      style={{ color, borderColor: `${color}44`, backgroundColor: `${color}14` }}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {name}
    </span>
  )
}
