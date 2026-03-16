'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'
import { RATING_DIMENSIONS, CONTEXT_TAGS, getScoreColor, MAX_REVIEW_LENGTH } from '@/lib/constants'
import type { FlavorTag } from '@/lib/types'

interface FlavorBasic {
  id: string
  name: string
  slug: string
  product: {
    id: string
    name: string
    slug: string
    brand: { name: string }
  }
  tags: FlavorTag[]
}

interface Props {
  flavor: FlavorBasic
}

const DEFAULT_SCORES: Record<string, number> = {
  taste: 7,
  sweetness: 7,
  pump: 7,
  energy: 7,
  intensity: 7,
}

function calcOverall(scores: Record<string, number>): number {
  return RATING_DIMENSIONS.reduce((sum, dim) => sum + (scores[dim.key] ?? 5) * dim.weight, 0)
}

export function RatingForm({ flavor }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [scores, setScores] = useState<Record<string, number>>(DEFAULT_SCORES)
  const [wouldBuyAgain, setWouldBuyAgain] = useState(true)
  const [contextTags, setContextTags] = useState<string[]>([])
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const overall = calcOverall(scores)
  const scoreColor = getScoreColor(overall)
  const charsLeft = MAX_REVIEW_LENGTH - reviewText.length
  const charsNearLimit = charsLeft < 40

  function toggleContextTag(tag: string) {
    setContextTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
      router.push(`/login?redirect=/rate/${flavor.slug}`)
      return
    }

    setSubmitting(true)
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    // Check for duplicate
    const { data: existing } = await db
      .from('ratings')
      .select('id')
      .eq('user_id', user.id)
      .eq('flavor_id', flavor.id)
      .maybeSingle()

    if (existing) {
      setError('You already rated this flavor.')
      setSubmitting(false)
      return
    }

    const { error: insertError } = await db.from('ratings').insert({
      user_id: user.id,
      flavor_id: flavor.id,
      scores,
      overall_score: parseFloat(overall.toFixed(2)),
      would_buy_again: wouldBuyAgain,
      context_tags: contextTags,
      review_text: reviewText.trim() || null,
    })

    if (insertError) {
      console.error('Rating insert error:', insertError)
      setError(`${insertError.message} (code: ${insertError.code})`)
      setSubmitting(false)
      return
    }

    router.push(`/flavors/${flavor.slug}`)
    router.refresh()
    setSubmitting(false)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: 'clamp(16px, 4vw, 40px) 16px 80px' }}>

      {/* Flavor header */}
      <div style={{ marginBottom: '36px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '7px',
          }}
        >
          {flavor.product.brand.name} · {flavor.product.name}
        </div>
        <h1
          style={{
            fontSize: 'clamp(22px, 4vw, 38px)',
            fontWeight: 900,
            margin: 0,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {flavor.name}
        </h1>
      </div>

      {/* Live score card */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: `1.5px solid ${scoreColor}33`,
          borderRadius: 'var(--radius-lg)',
          padding: '28px 24px',
          marginBottom: '36px',
          textAlign: 'center',
          transition: 'border-color 0.3s',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle glow behind score */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${scoreColor}0D 0%, transparent 70%)`,
            pointerEvents: 'none',
            transition: 'background 0.3s',
          }}
        />
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '10px',
            position: 'relative',
          }}
        >
          Overall Score
        </div>
        <div
          style={{
            fontSize: '80px',
            fontWeight: 900,
            lineHeight: 1,
            color: scoreColor,
            transition: 'color 0.3s',
            letterSpacing: '-0.04em',
            position: 'relative',
          }}
        >
          {overall.toFixed(1)}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-faint)',
            marginTop: '10px',
            letterSpacing: '0.02em',
            position: 'relative',
          }}
        >
          Taste ×0.25 · Sweetness ×0.10 · Pump ×0.25 · Energy ×0.25 · Intensity ×0.15
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '36px' }}>
          {RATING_DIMENSIONS.map((dim) => {
            const val = scores[dim.key] ?? 7
            const color = getScoreColor(val)
            return (
              <div
                key={dim.key}
                className="card"
                style={{ padding: '16px 18px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        color: 'var(--text)',
                      }}
                    >
                      {dim.label}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-faint)',
                        marginLeft: '7px',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      ×{dim.weight}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      color,
                      minWidth: '44px',
                      textAlign: 'right',
                      transition: 'color 0.2s',
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                    }}
                  >
                    {val.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={val}
                  onChange={(e) =>
                    setScores((prev) => ({ ...prev, [dim.key]: parseFloat(e.target.value) }))
                  }
                  style={{
                    width: '100%',
                    accentColor: color,
                    cursor: 'pointer',
                    height: '4px',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: 'var(--text-faint)',
                    marginTop: '6px',
                    letterSpacing: '0.02em',
                  }}
                >
                  <span>1 — Terrible</span>
                  <span>10 — Perfect</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Would buy again */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: '12px',
            }}
          >
            Would you buy this flavor again?
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {([true, false] as const).map((val) => {
              const isActive = wouldBuyAgain === val
              const activeColor = val ? 'var(--green)' : 'var(--red)'
              return (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setWouldBuyAgain(val)}
                  style={{
                    flex: 1,
                    padding: '13px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    border: isActive
                      ? `1.5px solid ${val ? 'var(--green)' : 'var(--red)'}`
                      : '1.5px solid var(--border)',
                    backgroundColor: isActive
                      ? val
                        ? 'color-mix(in srgb, var(--green) 10%, transparent)'
                        : 'color-mix(in srgb, var(--red) 10%, transparent)'
                      : 'var(--bg-card)',
                    color: isActive ? activeColor : 'var(--text-dim)',
                  }}
                >
                  {val ? '✓  Yes' : '✕  No'}
                </button>
              )
            })}
          </div>
        </div>

        {/* Context tags */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'baseline',
              gap: '6px',
            }}
          >
            How did you take it?
            <span style={{ color: 'var(--text-faint)', fontWeight: 400, fontSize: '12px' }}>
              optional
            </span>
          </div>
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            {CONTEXT_TAGS.map((tag) => {
              const active = contextTags.includes(tag.value)
              return (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleContextTag(tag.value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                    backgroundColor: active
                      ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                      : 'var(--bg-card)',
                    color: active ? 'var(--accent)' : 'var(--text-dim)',
                  }}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Review textarea */}
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'baseline',
                gap: '6px',
              }}
            >
              Review
              <span style={{ color: 'var(--text-faint)', fontWeight: 400, fontSize: '12px' }}>
                optional
              </span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: charsNearLimit ? 'var(--red)' : 'var(--text-faint)',
                transition: 'color 0.2s',
              }}
            >
              {charsLeft} left
            </span>
          </div>
          <textarea
            className="input"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value.slice(0, MAX_REVIEW_LENGTH))}
            placeholder="What did it taste like? Would you recommend it?"
            rows={4}
            style={{
              width: '100%',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              lineHeight: 1.65,
              minHeight: '100px',
            }}
          />
        </div>

        {/* Error state */}
        {error && (
          <div
            style={{
              color: 'var(--red)',
              fontSize: '13px',
              marginBottom: '16px',
              padding: '12px 16px',
              backgroundColor: 'color-mix(in srgb, var(--red) 8%, transparent)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid color-mix(in srgb, var(--red) 25%, transparent)',
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* Not logged in warning */}
        {!user && (
          <div
            style={{
              color: 'var(--yellow)',
              fontSize: '13px',
              marginBottom: '16px',
              padding: '12px 16px',
              backgroundColor: 'color-mix(in srgb, var(--yellow) 8%, transparent)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid color-mix(in srgb, var(--yellow) 25%, transparent)',
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            You need to be logged in to submit a rating.
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '15px',
            fontWeight: 800,
            borderRadius: 'var(--radius-md)',
            opacity: submitting ? 0.5 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
            letterSpacing: '0.01em',
          }}
        >
          {submitting ? 'Submitting…' : user ? 'Submit Rating' : 'Log in to rate'}
        </button>
      </form>
    </div>
  )
}
