import { RATING_DIMENSIONS } from './constants'

/**
 * Calculate overall score from dimension scores using category weights.
 * Default weights: Taste 40%, Sweetness 20%, Mixability 20%, Aftertaste 20%.
 */
export function calculateOverallScore(
  scores: Record<string, number>,
  dimensions = RATING_DIMENSIONS
): number {
  const total = dimensions.reduce((sum, dim) => {
    const score = scores[dim.key] ?? 0
    return sum + score * dim.weight
  }, 0)
  return Math.round(total * 100) / 100
}

/**
 * Format score for display (e.g. 8.4 → "8.4", 10 → "10.0")
 */
export function formatScore(score: number): string {
  return score.toFixed(1)
}

/**
 * Time ago string from date (e.g. "2 days ago")
 */
export function timeAgo(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

/**
 * Slugify a string for URL use
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Truncate text to max length with ellipsis
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1) + '…'
}

/**
 * Calculate "would buy again" percentage from an array of ratings
 */
export function calcWouldBuyPercent(ratings: { would_buy_again: boolean }[]): number | null {
  if (ratings.length === 0) return null
  const yes = ratings.filter((r) => r.would_buy_again).length
  return Math.round((yes / ratings.length) * 100)
}

/**
 * Format price per serving
 */
export function formatPrice(price: number | null): string {
  if (price === null) return '—'
  return `$${price.toFixed(2)}/serving`
}
