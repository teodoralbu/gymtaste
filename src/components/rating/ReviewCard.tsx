'use client'

import { useState } from 'react'
import Image from 'next/image'
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
  const scoreColor = getScoreColor(rating.overall_score)

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header row — always visible, tap to expand */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setExpanded(!expanded)
          }
        }}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse review" : "Expand review"}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '72px',
        }}
      >
        {/* Avatar — 32px */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent-glow), var(--bg-elevated))',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 800, color: 'var(--accent)', overflow: 'hidden',
        }}>
          {rating.user?.avatar_url ? (
            <Image src={rating.user.avatar_url} alt="" width={32} height={32} style={{ objectFit: 'cover' }} />
          ) : (
            rating.user?.username?.[0]?.toUpperCase() ?? '?'
          )}
        </div>

        {/* Username + preview text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              {rating.user?.username ?? 'Anonymous'}
            </span>
            {rating.user?.badge_tier && <Badge tier={rating.user.badge_tier as any} size="sm" />}
            {rating.would_buy_again && (
              <span style={{
                fontSize: '10px',
                color: 'var(--green)',
                fontWeight: 700,
                backgroundColor: 'color-mix(in srgb, var(--green) 10%, transparent)',
                padding: '2px 7px',
                borderRadius: '999px',
                border: '1px solid color-mix(in srgb, var(--green) 25%, transparent)',
                letterSpacing: '0.04em',
              }}>
                WBA
              </span>
            )}
          </div>
          {!expanded && rating.review_text && (
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {rating.review_text}
            </div>
          )}
        </div>

        {/* Score + chevron */}
        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '26px', fontWeight: 900, lineHeight: 1, color: scoreColor, letterSpacing: '-0.03em' }}>
            {rating.overall_score.toFixed(1)}
          </div>
          <div style={{
            fontSize: '16px',
            color: 'var(--text-faint)',
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            lineHeight: 1,
          }}>
            ›
          </div>
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-soft)', padding: '14px 16px 16px' }}>
          {/* Dimension score pills */}
          {Object.keys(rating.scores ?? {}).length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {RATING_DIMENSIONS.map((dim) => {
                const score = (rating.scores as Record<string, number>)?.[dim.key]
                if (score === undefined) return null
                return (
                  <div key={dim.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: '8px',
                    padding: '5px 10px',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: getScoreColor(score) }}>{score}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{dim.label}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Review text */}
          {rating.review_text && (
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '14px',
              lineHeight: 1.6,
              margin: '0 0 12px',
              fontStyle: 'italic',
            }}>
              &ldquo;{rating.review_text}&rdquo;
            </p>
          )}

          {/* Context tags */}
          {rating.context_tags && rating.context_tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {rating.context_tags.map((tag) => (
                <span key={tag} className="tag" style={{ fontSize: '11px' }}>{tag.replace(/_/g, ' ')}</span>
              ))}
            </div>
          )}

          <LikeButton
            targetId={rating.id}
            targetTable="review_likes"
            targetColumn="rating_id"
            initialCount={rating.like_count}
            initialLiked={rating.user_has_liked}
          />
        </div>
      )}
    </div>
  )
}
