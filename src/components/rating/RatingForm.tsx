'use client'

import { useState, memo, useCallback } from 'react'
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

interface SliderRowProps {
  dim: typeof RATING_DIMENSIONS[number]
  value: number
  onChange: (key: string, value: number) => void
}

const SliderRow = memo(function SliderRow({ dim, value, onChange }: SliderRowProps) {
  const color = getScoreColor(value)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>{dim.label}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ×{dim.weight}
          </span>
        </div>
        <span style={{
          fontSize: '20px',
          fontWeight: 900,
          color,
          minWidth: '48px',
          textAlign: 'right',
          transition: 'color 0.2s',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>
          {value.toFixed(1)}
        </span>
      </div>
      <input
        type="range" min={1} max={10} step={0.5} value={value}
        onChange={(e) => onChange(dim.key, parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: color, cursor: 'pointer', height: '4px', display: 'block' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-faint)', marginTop: '6px', letterSpacing: '0.02em' }}>
        <span>1 — Terrible</span>
        <span>10 — Perfect</span>
      </div>
    </div>
  )
})

// Section wrapper — card surface with border
function Section({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      {title && (
        <div style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'baseline',
          gap: '6px',
        }}>
          {title}
          {subtitle && (
            <span style={{ color: 'var(--text-faint)', fontWeight: 400, fontSize: '12px', textTransform: 'none', letterSpacing: 0 }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
      }}>
        {children}
      </div>
    </div>
  )
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
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const overall = calcOverall(scores)
  const scoreColor = getScoreColor(overall)
  const charsLeft = MAX_REVIEW_LENGTH - reviewText.length
  const charsNearLimit = charsLeft < 40

  const handleScoreChange = useCallback((key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }))
  }, [])

  function toggleContextTag(tag: string) {
    setContextTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (!user) {
      router.push(`/login?redirect=/rate/${flavor.slug}`)
      return
    }

    setSubmitting(true)
    setError(null)

    let photoUrl: string | null = null
    if (photoFile && user) {
      const ext = photoFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('review-photos').upload(path, photoFile)
      if (uploadError) {
        setError('Photo upload failed. Try a smaller image or continue without one.')
        setSubmitting(false)
        return
      }
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('review-photos').getPublicUrl(path)
        photoUrl = urlData.publicUrl
      }
    }

    // Check isFirst BEFORE insert to avoid read-after-write latency issues
    const { count: existingCount } = await supabase
      .from('ratings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    const isFirst = existingCount === 0

    const { error: insertError } = await supabase.from('ratings').insert({
      user_id: user.id,
      flavor_id: flavor.id,
      scores,
      overall_score: parseFloat(overall.toFixed(2)),
      would_buy_again: wouldBuyAgain,
      context_tags: contextTags,
      review_text: reviewText.trim() || null,
      photo_url: photoUrl,
    })

    if (insertError) {
      console.error('Rating insert error:', insertError)
      setError('Could not submit rating. Please try again.')
      setSubmitting(false)
      return
    }

    router.push(`/rate/${flavor.slug}/success?score=${overall.toFixed(1)}${isFirst ? '&first=1' : ''}`)
    setSubmitting(false)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 16px', paddingBottom: 'calc(160px + env(safe-area-inset-bottom))' }}>

      {/* Flavor header */}
      <div style={{ marginBottom: '32px', paddingTop: 'clamp(20px, 4vw, 40px)' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '8px',
        }}>
          {flavor.product.brand.name} · {flavor.product.name}
        </div>
        <h1 style={{
          fontSize: 'clamp(26px, 6vw, 40px)',
          fontWeight: 900,
          margin: 0,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          {flavor.name}
        </h1>
      </div>

      {/* Overall score live preview */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: `1.5px solid ${scoreColor}33`,
        borderRadius: 'var(--radius-lg)',
        padding: '28px 24px',
        marginBottom: '24px',
        textAlign: 'center',
        transition: 'border-color 0.3s',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Radial glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${scoreColor}10 0%, transparent 70%)`,
          pointerEvents: 'none',
          transition: 'background 0.3s',
        }} />
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-faint)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '8px',
          position: 'relative',
        }}>
          Overall Score
        </div>
        <div style={{
          fontSize: '80px',
          fontWeight: 900,
          lineHeight: 1,
          color: scoreColor,
          transition: 'color 0.3s',
          letterSpacing: '-0.04em',
          position: 'relative',
        }}>
          {overall.toFixed(1)}
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--text-faint)',
          marginTop: '10px',
          letterSpacing: '0.02em',
          position: 'relative',
        }}>
          Taste ×0.25 · Sweetness ×0.10 · Pump ×0.25 · Energy ×0.25 · Intensity ×0.15
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Sliders section */}
        <Section title="Rate each dimension">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {RATING_DIMENSIONS.map((dim) => (
              <SliderRow
                key={dim.key}
                dim={dim}
                value={scores[dim.key] ?? 7}
                onChange={handleScoreChange}
              />
            ))}
          </div>
        </Section>

        {/* Would buy again */}
        <Section title="Buy it again?">
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
                    padding: '14px 16px',
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
                      : 'var(--bg-elevated)',
                    color: isActive ? activeColor : 'var(--text-dim)',
                  }}
                >
                  {val ? '✓  Yes' : '✕  No'}
                </button>
              )
            })}
          </div>
        </Section>

        {/* Context tags */}
        <Section title="When did you drink it?" subtitle="optional">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CONTEXT_TAGS.map((tag) => {
              const active = contextTags.includes(tag.value)
              return (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleContextTag(tag.value)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    transition: 'all 0.15s',
                    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                    backgroundColor: active
                      ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                      : 'var(--bg-elevated)',
                    color: active ? 'var(--accent)' : 'var(--text-dim)',
                  }}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
        </Section>

        {/* Review text */}
        <Section title="Your take" subtitle="optional">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: charsNearLimit ? 'var(--red)' : 'var(--text-faint)',
              transition: 'color 0.2s',
            }}>
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
        </Section>

        {/* Photo upload */}
        <Section title="Add a photo" subtitle="optional">
          {photoPreview ? (
            <div style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Preview" style={{ width: '100%', borderRadius: '10px', maxHeight: '200px', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                style={{
                  position: 'absolute', top: '8px', right: '8px',
                  width: '44px', height: '44px', borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.6)', border: 'none',
                  color: '#fff', fontSize: '16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>
          ) : (
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '24px', borderRadius: '10px',
              border: '2px dashed var(--border)', cursor: 'pointer',
              backgroundColor: 'var(--bg-elevated)', transition: 'border-color 0.15s',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Tap to add a photo</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setPhotoFile(file)
                    setPhotoPreview((prev) => {
                      if (prev) URL.revokeObjectURL(prev)
                      return URL.createObjectURL(file)
                    })
                  }
                }}
              />
            </label>
          )}
        </Section>

        {/* Error state */}
        {error && (
          <div style={{
            color: 'var(--red)',
            fontSize: '13px',
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: 'color-mix(in srgb, var(--red) 8%, transparent)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid color-mix(in srgb, var(--red) 25%, transparent)',
            lineHeight: 1.5,
            fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        {/* Not logged in warning */}
        {!user && (
          <div style={{
            color: 'var(--yellow)',
            fontSize: '13px',
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: 'color-mix(in srgb, var(--yellow) 8%, transparent)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid color-mix(in srgb, var(--yellow) 25%, transparent)',
            lineHeight: 1.5,
            fontWeight: 500,
          }}>
            You need to be logged in to submit a rating.
          </div>
        )}

        {/* Sticky submit button */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg)',
          paddingTop: '12px',
          paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom) + 12px))',
          borderTop: '1px solid var(--border-soft)',
          marginLeft: '-16px',
          marginRight: '-16px',
          paddingLeft: '16px',
          paddingRight: '16px',
          zIndex: 45,
        }}>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{
              width: '100%',
              height: '52px',
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
        </div>
      </form>
    </div>
  )
}
