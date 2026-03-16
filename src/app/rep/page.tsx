'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'
import { XP_VALUES } from '@/lib/constants'

type RepForm = 'progress' | 'pr' | 'checkin' | null

export default function RepPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeForm, setActiveForm] = useState<RepForm>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Progress Photo form state
  const [progressCaption, setProgressCaption] = useState('')
  const [progressVisibility, setProgressVisibility] = useState<'public' | 'followers'>('public')
  const [progressPhotoFile, setProgressPhotoFile] = useState<File | null>(null)
  const [progressPhotoPreview, setProgressPhotoPreview] = useState<string | null>(null)
  const progressFileRef = useRef<HTMLInputElement>(null)

  // PR form state
  const [prExercise, setPrExercise] = useState('')
  const [prValue, setPrValue] = useState('')
  const [prUnit, setPrUnit] = useState<'kg' | 'lbs' | 'reps'>('kg')
  const [prCaption, setPrCaption] = useState('')
  const [prVisibility, setPrVisibility] = useState<'public' | 'followers'>('public')

  // Check-in form state
  const [checkinGym, setCheckinGym] = useState('')
  const [checkinNote, setCheckinNote] = useState('')
  const [checkinVisibility, setCheckinVisibility] = useState<'public' | 'followers'>('public')

  function handleProgressPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setProgressPhotoFile(file)
    const url = URL.createObjectURL(file)
    setProgressPhotoPreview(url)
  }

  async function uploadPhoto(file: File): Promise<string | null> {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const ext = file.name.split('.').pop()
    const filename = `rep_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await db.storage.from('rep-photo').upload(filename, file)
    if (uploadError) return null
    const { data } = db.storage.from('rep-photo').getPublicUrl(filename)
    return data?.publicUrl ?? null
  }

  async function submitRep(
    type: 'progress' | 'pr' | 'checkin',
    payload: Record<string, unknown>,
    xpEarned: number
  ) {
    if (!user) {
      setError('You must be logged in to post a Rep.')
      return
    }
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    const { error: insertError } = await db.from('reps').insert({
      type,
      user_id: user.id,
      xp_earned: xpEarned,
      ...payload,
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    // Award XP
    await db.rpc('increment_user_xp', { user_id: user.id, xp_amount: xpEarned }).catch(() => {
      // Fallback: direct update if RPC not available
      db.from('users')
        .select('xp')
        .eq('id', user.id)
        .single()
        .then(({ data }: { data: { xp: number } | null }) => {
          const currentXp = data?.xp ?? 0
          db.from('users').update({ xp: currentXp + xpEarned }).eq('id', user.id)
        })
    })

    router.push('/')
  }

  async function handleProgressSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!progressPhotoFile) {
      setError('Please select a photo.')
      return
    }
    let photoUrl: string | null = null
    if (progressPhotoFile) {
      photoUrl = await uploadPhoto(progressPhotoFile)
    }
    await submitRep('progress', {
      photo_url: photoUrl,
      content: progressCaption || null,
      visibility: progressVisibility,
    }, XP_VALUES.progress)
  }

  async function handlePrSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prExercise.trim()) { setError('Exercise name is required.'); return }
    if (!prValue || isNaN(Number(prValue))) { setError('Weight/reps value is required.'); return }
    await submitRep('pr', {
      pr_exercise: prExercise.trim(),
      pr_value: Number(prValue),
      pr_unit: prUnit,
      content: prCaption || null,
      visibility: prVisibility,
    }, XP_VALUES.pr)
  }

  async function handleCheckinSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!checkinGym.trim()) { setError('Gym name is required.'); return }
    await submitRep('checkin', {
      gym_name: checkinGym.trim(),
      content: checkinNote || null,
      visibility: checkinVisibility,
    }, XP_VALUES.checkin)
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, transform 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  }

  const xpBadgeStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--accent)',
    backgroundColor: 'var(--accent-dim)',
    border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
    borderRadius: '999px',
    padding: '2px 8px',
    marginLeft: 'auto',
    flexShrink: 0,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-dim)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const visibilityToggleStyle = (selected: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '8px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: 600,
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: selected ? 'var(--accent)' : 'var(--bg-elevated)',
    color: selected ? '#000' : 'var(--text-dim)',
    transition: 'background-color 0.15s',
  })

  const submitBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    backgroundColor: 'var(--accent)',
    color: '#000',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    fontWeight: 700,
    cursor: submitting ? 'not-allowed' : 'pointer',
    opacity: submitting ? 0.6 : 1,
    marginTop: '8px',
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px 96px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        {activeForm ? (
          <button
            onClick={() => { setActiveForm(null); setError(null) }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0 0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ← Back
          </button>
        ) : null}
        <h1 style={{
          fontSize: '24px',
          fontWeight: 900,
          color: 'var(--text)',
          margin: 0,
          letterSpacing: '-0.02em',
        }}>
          {activeForm === 'progress' ? 'Progress Photo' :
           activeForm === 'pr' ? 'Personal Record' :
           activeForm === 'checkin' ? 'Check-in' :
           'Post a Rep'}
        </h1>
        {!activeForm && (
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--text-dim)' }}>
            Share what you&apos;re doing with the community.
          </p>
        )}
      </div>

      {error && (
        <div style={{
          backgroundColor: 'color-mix(in srgb, var(--red) 12%, transparent)',
          border: '1px solid color-mix(in srgb, var(--red) 30%, transparent)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: '13px',
          color: 'var(--red)',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {/* Hub cards — shown when no form is active */}
      {!activeForm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Rate a Supplement */}
          <Link
            href="/browse"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={cardStyle}>
              <span style={{ fontSize: '28px', flexShrink: 0 }}>⚡</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>
                  Rate a Supplement
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  Browse and rate a flavor
                </div>
              </div>
              <span style={xpBadgeStyle}>+{XP_VALUES.rating} XP</span>
            </div>
          </Link>

          {/* Progress Photo */}
          <div style={cardStyle} onClick={() => setActiveForm('progress')}>
            <span style={{ fontSize: '28px', flexShrink: 0 }}>📸</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>
                Progress Photo
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Show your gains
              </div>
            </div>
            <span style={xpBadgeStyle}>+{XP_VALUES.progress} XP</span>
          </div>

          {/* Personal Record */}
          <div style={cardStyle} onClick={() => setActiveForm('pr')}>
            <span style={{ fontSize: '28px', flexShrink: 0 }}>🏋️</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>
                Personal Record
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Log a new PR
              </div>
            </div>
            <span style={xpBadgeStyle}>+{XP_VALUES.pr} XP</span>
          </div>

          {/* Check-in */}
          <div style={cardStyle} onClick={() => setActiveForm('checkin')}>
            <span style={{ fontSize: '28px', flexShrink: 0 }}>📍</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>
                Check-in
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Where are you training?
              </div>
            </div>
            <span style={xpBadgeStyle}>+{XP_VALUES.checkin} XP</span>
          </div>

        </div>
      )}

      {/* Progress Photo Form */}
      {activeForm === 'progress' && (
        <form onSubmit={handleProgressSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Photo (required)</label>
            <div
              onClick={() => progressFileRef.current?.click()}
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-elevated)',
                transition: 'border-color 0.15s',
              }}
            >
              {progressPhotoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={progressPhotoPreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', display: 'block', margin: '0 auto' }}
                />
              ) : (
                <div>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📷</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Tap to select a photo</div>
                </div>
              )}
            </div>
            <input
              ref={progressFileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleProgressPhoto}
            />
          </div>

          <div>
            <label style={labelStyle}>Caption (optional)</label>
            <textarea
              value={progressCaption}
              onChange={(e) => setProgressCaption(e.target.value.slice(0, 280))}
              placeholder="What&apos;s the story?"
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', textAlign: 'right', marginTop: '4px' }}>
              {progressCaption.length}/280
            </div>
          </div>

          <div>
            <label style={labelStyle}>Visibility</label>
            <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
              <button type="button" style={visibilityToggleStyle(progressVisibility === 'public')} onClick={() => setProgressVisibility('public')}>
                Public
              </button>
              <button type="button" style={visibilityToggleStyle(progressVisibility === 'followers')} onClick={() => setProgressVisibility('followers')}>
                Followers only
              </button>
            </div>
          </div>

          <button type="submit" style={submitBtnStyle} disabled={submitting}>
            {submitting ? 'Posting...' : `Post Rep · +${XP_VALUES.progress} XP`}
          </button>
        </form>
      )}

      {/* PR Form */}
      {activeForm === 'pr' && (
        <form onSubmit={handlePrSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Exercise (required)</label>
            <input
              type="text"
              value={prExercise}
              onChange={(e) => setPrExercise(e.target.value)}
              placeholder="e.g. Bench Press, Squat..."
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Value (required)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                value={prValue}
                onChange={(e) => setPrValue(e.target.value)}
                placeholder="0"
                min="0"
                step="any"
                style={{ ...inputStyle, flex: 1 }}
                required
              />
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
                {(['kg', 'lbs', 'reps'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setPrUnit(u)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: prUnit === u ? 'var(--accent)' : 'transparent',
                      color: prUnit === u ? '#000' : 'var(--text-dim)',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Caption (optional)</label>
            <textarea
              value={prCaption}
              onChange={(e) => setPrCaption(e.target.value.slice(0, 280))}
              placeholder="How did it feel?"
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', textAlign: 'right', marginTop: '4px' }}>
              {prCaption.length}/280
            </div>
          </div>

          <div>
            <label style={labelStyle}>Visibility</label>
            <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
              <button type="button" style={visibilityToggleStyle(prVisibility === 'public')} onClick={() => setPrVisibility('public')}>
                Public
              </button>
              <button type="button" style={visibilityToggleStyle(prVisibility === 'followers')} onClick={() => setPrVisibility('followers')}>
                Followers only
              </button>
            </div>
          </div>

          <button type="submit" style={submitBtnStyle} disabled={submitting}>
            {submitting ? 'Posting...' : `Post Rep · +${XP_VALUES.pr} XP`}
          </button>
        </form>
      )}

      {/* Check-in Form */}
      {activeForm === 'checkin' && (
        <form onSubmit={handleCheckinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Gym name (required)</label>
            <input
              type="text"
              value={checkinGym}
              onChange={(e) => setCheckinGym(e.target.value)}
              placeholder="e.g. Gold's Gym, Planet Fitness..."
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Note (optional)</label>
            <textarea
              value={checkinNote}
              onChange={(e) => setCheckinNote(e.target.value.slice(0, 280))}
              placeholder="How's the session going?"
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', textAlign: 'right', marginTop: '4px' }}>
              {checkinNote.length}/280
            </div>
          </div>

          <div>
            <label style={labelStyle}>Visibility</label>
            <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
              <button type="button" style={visibilityToggleStyle(checkinVisibility === 'public')} onClick={() => setCheckinVisibility('public')}>
                Public
              </button>
              <button type="button" style={visibilityToggleStyle(checkinVisibility === 'followers')} onClick={() => setCheckinVisibility('followers')}>
                Followers only
              </button>
            </div>
          </div>

          <button type="submit" style={submitBtnStyle} disabled={submitting}>
            {submitting ? 'Posting...' : `Post Rep · +${XP_VALUES.checkin} XP`}
          </button>
        </form>
      )}

    </div>
  )
}
