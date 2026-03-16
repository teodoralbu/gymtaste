'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { LikeButton } from '@/components/rating/LikeButton'
import { RATING_DIMENSIONS, getScoreColor } from '@/lib/constants'

interface ReviewCardProps {
  rating: {
    id: string
    overall_score: number
    would_buy_again: boolean
    review_text: string | null
    context_tags: string[]
    scores: Record<string, number>
    like_count: number
    user_has_liked: boolean
    user: {
      username: string
      avatar_url: string | null
      badge_tier: string
    } | null
  }
}

export function ReviewCard({ rating }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card" style={{ padding: '14px 16px', overflow: 'hidden' }}>
      {/* Header row — always visible, tap to expand */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
      >
        {/* Avatar */}
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent-glow), var(--bg-elevated))',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 800, color: 'var(--accent)', overflow: 'hidden',
        }}>
          {rating.user?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rating.user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            rating.user?.username?.[0]?.toUpperCase() ?? '?'
          )}
        </div>

        {/* User + preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              {rating.user?.username ?? 'Anonymous'}
            </span>
            {rating.user?.badge_tier && <Badge tier={rating.user.badge_tier as any} size="sm" />}
          </div>
          {!expanded && rating.review_text && (
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {rating.review_text}
            </div>
          )}
        </div>

        {/* Score + expand indicator */}
        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {rating.would_buy_again && (
            <span style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 700 }}>✓</span>
          )}
          <div style={{ fontSize: '22px', fontWeight: 900, lineHeight: 1, color: getScoreColor(rating.overall_score), letterSpacing: '-0.02em' }}>
            {rating.overall_score.toFixed(1)}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-faint)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ›
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-soft)' }}>
          {/* Dimension scores */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: rating.review_text || rating.context_tags?.length > 0 ? '10px' : 0 }}>
            {RATING_DIMENSIONS.map((dim) => {
              const score = (rating.scores as Record<string, number>)?.[dim.key]
              if (score === undefined) return null
              return (
                <div key={dim.key} style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  backgroundColor: 'var(--bg-elevated)', borderRadius: '6px', padding: '4px 8px',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: getScoreColor(score) }}>{score}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{dim.label}</span>
                </div>
              )
            })}
          </div>

          {rating.review_text && (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 10px' }}>
              &ldquo;{rating.review_text}&rdquo;
            </p>
          )}

          {rating.context_tags && rating.context_tags.length > 0 && (
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {rating.context_tags.map((tag) => (
                <span key={tag} className="tag" style={{ fontSize: '10px' }}>{tag.replace(/_/g, ' ')}</span>
              ))}
            </div>
          )}

          <LikeButton
            ratingId={rating.id}
            initialCount={rating.like_count}
            initialLiked={rating.user_has_liked}
          />
        </div>
      )}
    </div>
  )
}
