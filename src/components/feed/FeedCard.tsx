'use client'

import Link from 'next/link'
import { timeAgo } from '@/lib/timeAgo'
import { getScoreColor } from '@/lib/constants'
import { LikeButton } from '@/components/rating/LikeButton'
import { CommentsSection } from '@/components/rating/CommentsSection'

export interface FeedItem {
  _type: 'rating' | 'rep'
  id: string
  created_at: string
  user: { username: string; avatar_url: string | null; xp?: number } | null
  // rating fields (optional)
  overall_score?: number
  would_buy_again?: boolean
  review_text?: string | null
  photo_url?: string | null
  comment_count?: number
  like_count?: number
  user_has_liked?: boolean
  scores?: Record<string, number> | null
  context_tags?: string[] | null
  flavor?: {
    name: string
    slug: string
    products: {
      name: string
      slug: string
      image_url: string | null
      brands: { name: string }
    }
  } | null
  // rep fields (optional)
  type?: 'progress' | 'pr' | 'checkin'
  content?: string | null
  pr_exercise?: string | null
  pr_value?: number | null
  pr_unit?: string | null
  gym_name?: string | null
  xp_earned?: number
}

// Legacy interface for backward compatibility
interface FeedRating {
  id: string
  overall_score: number
  would_buy_again: boolean
  review_text: string | null
  photo_url: string | null
  created_at: string
  comment_count: number
  flavor: {
    name: string
    slug: string
    products: {
      name: string
      slug: string
      image_url: string | null
      brands: { name: string }
    }
  } | null
  user: {
    username: string
    avatar_url: string | null
    badge_tier: string
  } | null
}

const CONTEXT_TAG_LABELS: Record<string, string> = {
  leg_day: 'Leg day', push_day: 'Push day', pull_day: 'Pull day',
  upper_body: 'Upper body', cardio: 'Cardio', full_body: 'Full body',
  morning_session: 'Morning session', evening_session: 'Evening session',
  empty_stomach: 'Empty stomach', after_meal: 'After meal',
  mixed_with_water: 'Mixed with water', mixed_with_milk: 'Mixed with milk',
  mixed_with_juice: 'Mixed with juice',
}

function scoreWord(score: number): string {
  if (score >= 9) return 'Amazing'
  if (score >= 7.5) return 'Great'
  if (score >= 6) return 'Decent'
  return 'Weak'
}

function ExperienceLine({ scores, wba }: { scores: Record<string, number>; wba: boolean }) {
  const parts: string[] = []
  if (scores.taste != null)  parts.push(`Taste: ${scoreWord(scores.taste)}`)
  if (scores.pump != null)   parts.push(`Pump: ${scoreWord(scores.pump)}`)
  if (scores.energy != null) parts.push(`Energy: ${scoreWord(scores.energy)}`)
  if (parts.length === 0) return null
  return (
    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: wba ? '6px' : 0, lineHeight: 1.5 }}>
      {parts.join(' · ')}
      {wba && <span style={{ color: 'var(--green)', fontWeight: 700, marginLeft: '8px' }}>✓ Would buy again</span>}
    </div>
  )
}

function XpBadge({ xp }: { xp: number }) {
  return (
    <span style={{
      fontSize: '10px',
      fontWeight: 700,
      color: 'var(--accent)',
      backgroundColor: 'var(--accent-dim)',
      border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
      borderRadius: '999px',
      padding: '2px 7px',
      flexShrink: 0,
    }}>
      +{xp} XP
    </span>
  )
}

function RepCard({ item, index = 0 }: { item: FeedItem; index?: number }) {
  const repType = item.type
  const delay = `${Math.min(index, 5) * 40}ms`

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      margin: '0 16px 12px',
      overflow: 'hidden',
      animation: 'feedIn 0.2s ease forwards',
      animationDelay: delay,
      opacity: 0,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 16px 10px' }}>
        <Link href={item.user?.username ? `/users/${item.user.username}` : '#'} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 800, color: 'var(--accent)', overflow: 'hidden',
          }}>
            {item.user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.user.avatar_url} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              item.user?.username?.[0]?.toUpperCase() ?? '?'
            )}
          </div>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={item.user?.username ? `/users/${item.user.username}` : '#'} style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              {item.user?.username ?? 'Anonymous'}
            </span>
          </Link>
          <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginLeft: '6px' }}>
            {timeAgo(item.created_at)}
          </span>
        </div>
      </div>

      {/* Rep body */}
      <div style={{ padding: '0 16px 12px' }}>
        {/* Progress Photo */}
        {repType === 'progress' && item.photo_url && (
          <div style={{ marginBottom: '8px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.photo_url}
              alt="Progress photo"
              style={{ width: '100%', borderRadius: '10px', maxHeight: '340px', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {/* PR display */}
        {repType === 'pr' && (
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              🏋️ {item.pr_exercise}: {item.pr_value}{item.pr_unit}
            </div>
          </div>
        )}

        {/* Check-in display */}
        {repType === 'checkin' && (
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>
              📍 {item.gym_name}
            </div>
          </div>
        )}

        {/* Caption / note */}
        {item.content && (
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {item.content}
          </p>
        )}
      </div>

      {/* Actions row */}
      <div style={{
        padding: '10px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderTop: '1px solid var(--border-soft)',
        minHeight: '44px',
      }}>
        <div style={{ flex: 1 }} />
        {item.xp_earned ? <XpBadge xp={item.xp_earned} /> : null}
      </div>
    </div>
  )
}

export function FeedCard({ rating, item, initialLiked = false, initialLikeCount = 0, index = 0 }: {
  rating?: FeedRating | FeedItem
  item?: FeedItem
  initialLiked?: boolean
  initialLikeCount?: number
  index?: number
}) {
  // Resolve the actual feed item — support both `item` prop and legacy `rating` prop
  const feedItem = item ?? (rating as FeedItem | undefined)

  if (!feedItem) return null

  // Route to RepCard for rep type items
  if (feedItem._type === 'rep') {
    return <RepCard item={feedItem} index={index} />
  }

  // Render rating card (original behavior)
  const ratingData = feedItem as FeedItem
  const product = (ratingData.flavor as any)?.products
  const brand = product?.brands
  const score = ratingData.overall_score ?? 0
  const scoreColor = getScoreColor(score)
  const delay = `${Math.min(index, 5) * 40}ms`

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      margin: '0 16px 12px',
      overflow: 'hidden',
      animation: 'feedIn 0.2s ease forwards',
      animationDelay: delay,
      opacity: 0,
    }}>
      {/* Header: avatar + username + time + WBA badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 16px 10px' }}>
        <Link href={ratingData.user?.username ? `/users/${ratingData.user.username}` : '#'} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 800, color: 'var(--accent)', overflow: 'hidden',
          }}>
            {ratingData.user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ratingData.user.avatar_url} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              ratingData.user?.username?.[0]?.toUpperCase() ?? '?'
            )}
          </div>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={ratingData.user?.username ? `/users/${ratingData.user.username}` : '#'} style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              {ratingData.user?.username ?? 'Anonymous'}
            </span>
          </Link>
          <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginLeft: '6px' }}>
            {timeAgo(ratingData.created_at)}
          </span>
        </div>
        {ratingData.would_buy_again && (
          <span style={{
            fontSize: '10px',
            color: 'var(--green)',
            fontWeight: 700,
            backgroundColor: 'color-mix(in srgb, var(--green) 10%, transparent)',
            padding: '3px 8px',
            borderRadius: '999px',
            border: '1px solid color-mix(in srgb, var(--green) 25%, transparent)',
            flexShrink: 0,
            letterSpacing: '0.04em',
          }}>
            WBA
          </span>
        )}
      </div>

      {/* Product + Score block — tappable */}
      <Link href={`/flavors/${ratingData.flavor?.slug ?? ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: '0 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '52px' }}>
          {/* Product image — 52px */}
          <div style={{
            width: '52px', height: '52px', borderRadius: '10px', flexShrink: 0,
            backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {product?.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
            ) : (
              <span style={{ fontSize: '20px' }}>⚡</span>
            )}
          </div>

          {/* Flavor + brand · product */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ratingData.flavor?.name ?? 'Unknown flavor'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              {brand?.name} · {product?.name}
            </div>
          </div>

          {/* Score — 32px, right side */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1, color: scoreColor, letterSpacing: '-0.03em' }}>
              {score.toFixed(1)}
            </div>
          </div>
        </div>
      </Link>

      {/* Experience line — auto-generated from scores */}
      {ratingData.scores && (
        <div style={{ padding: '0 16px 10px' }}>
          <ExperienceLine scores={ratingData.scores} wba={ratingData.would_buy_again ?? false} />
        </div>
      )}

      {/* Context tags */}
      {ratingData.context_tags && ratingData.context_tags.length > 0 && (
        <div style={{ padding: '0 16px 10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {ratingData.context_tags.map((tag) => (
            <span key={tag} style={{
              fontSize: '11px', fontWeight: 600,
              color: 'var(--text-faint)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-soft)',
              borderRadius: '999px',
              padding: '3px 9px',
            }}>
              {CONTEXT_TAG_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>
      )}

      {/* Review note — secondary caption */}
      {ratingData.review_text && (
        <div style={{ padding: '0 16px 12px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            &ldquo;{ratingData.review_text}&rdquo;
          </p>
        </div>
      )}

      {/* Review photo */}
      {ratingData.photo_url && (
        <div style={{ padding: '0 16px 12px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ratingData.photo_url}
            alt="Review photo"
            loading="lazy"
            decoding="async"
            style={{ width: '100%', borderRadius: '10px', maxHeight: '220px', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* Actions: like + comment */}
      <div style={{
        padding: '10px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        borderTop: '1px solid var(--border-soft)',
        minHeight: '44px',
      }}>
        <LikeButton
          targetId={ratingData.id}
          targetTable="review_likes"
          targetColumn="rating_id"
          initialCount={ratingData.like_count ?? initialLikeCount}
          initialLiked={ratingData.user_has_liked ?? initialLiked}
        />
      </div>

      {/* Comments */}
      <CommentsSection ratingId={ratingData.id} initialCount={ratingData.comment_count ?? 0} />
    </div>
  )
}
