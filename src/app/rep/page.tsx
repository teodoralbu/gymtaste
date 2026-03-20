'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'
import { useToast } from '@/context/ToastContext'
import { XP_VALUES } from '@/lib/constants'

type RepForm = 'progress' | 'pr' | 'checkin' | null
type Visibility = 'public' | 'followers_only'

const btn: React.CSSProperties = {
  fontFamily: 'inherit', border: 'none', cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', fontFamily: 'inherit',
  backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '15px',
  outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: 'var(--text-dim)', marginBottom: '7px',
  textTransform: 'uppercase', letterSpacing: '0.05em',
}

function VisPicker({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  return (
    <div>
      <label style={labelStyle}>Visibility</label>
      <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
        {(['public', 'followers_only'] as Visibility[]).map((v) => (
          <button key={v} type="button" onClick={() => onChange(v)} style={{
            ...btn, flex: 1, padding: '8px', textAlign: 'center',
            fontSize: '13px', fontWeight: 600, borderRadius: 'var(--radius-sm)',
            backgroundColor: value === v ? 'var(--accent)' : 'transparent',
            color: value === v ? '#000' : 'var(--text-dim)',
          }}>
            {v === 'public' ? 'Public' : 'Followers only'}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function RepPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [activeForm, setActiveForm] = useState<RepForm>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [posted, setPosted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Progress
  const [progressCaption, setProgressCaption] = useState('')
  const [progressVis, setProgressVis] = useState<Visibility>('public')
  const [progressPhotoFile, setProgressPhotoFile] = useState<File | null>(null)
  const [progressPhotoPreview, setProgressPhotoPreview] = useState<string | null>(null)
  const progressFileRef = useRef<HTMLInputElement>(null)
  const progressLibraryRef = useRef<HTMLInputElement>(null)

  // PR
  const [prExercise, setPrExercise] = useState('')
  const [prValue, setPrValue] = useState('')
  const [prUnit, setPrUnit] = useState<'kg' | 'lbs' | 'reps'>('kg')
  const [prCaption, setPrCaption] = useState('')
  const [prVis, setPrVis] = useState<Visibility>('public')

  // Check-in
  const [checkinGym, setCheckinGym] = useState('')
  const [checkinNote, setCheckinNote] = useState('')
  const [checkinVis, setCheckinVis] = useState<Visibility>('public')

  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1080
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => resolve(new File([blob!], 'photo.jpg', { type: 'image/jpeg' })),
          'image/jpeg', 0.82
        )
      }
      img.src = URL.createObjectURL(file)
    })
  }

  async function uploadPhoto(file: File): Promise<string | null> {
    setUploadingPhoto(true)
    const compressed = await compressImage(file)
    const supabase = createClient()
    const filename = `${user!.id}/${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage.from('rep-photo').upload(filename, compressed, { contentType: 'image/jpeg' })
    setUploadingPhoto(false)
    if (uploadError) { setError('Photo upload failed: ' + uploadError.message); return null }
    const { data } = supabase.storage.from('rep-photo').getPublicUrl(filename)
    return data?.publicUrl ?? null
  }

  async function submitRep(type: 'progress' | 'pr' | 'checkin', payload: Record<string, unknown>, xp: number) {
    if (!user) { setError('You must be logged in.'); return }
    setSubmitting(true)
    setError(null)

    const supabase = createClient()

    const { error: insertError } = await supabase.from('reps').insert({
      type, user_id: user.id, xp_earned: xp,
      photo_url: (payload.photo_url as string) ?? null,
      content: (payload.content as string) ?? null,
      pr_exercise: (payload.pr_exercise as string) ?? null,
      pr_value: (payload.pr_value as number) ?? null,
      pr_unit: (payload.pr_unit as string) ?? null,
      gym_name: (payload.gym_name as string) ?? null,
      visibility: (payload.visibility as string) ?? 'public',
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    // Award XP — direct update
    const { data: userData } = await supabase.from('users').select('xp').eq('id', user.id).single()
    await supabase.from('users').update({ xp: (userData?.xp ?? 0) + xp }).eq('id', user.id)

    setSubmitting(false)
    setPosted(true)
    showToast(`🔥 +${xp} XP earned!`)
    setTimeout(() => router.push('/'), 1200)
  }

  async function handleProgressSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!progressPhotoFile) { setError('Please select a photo.'); return }
    const photoUrl = await uploadPhoto(progressPhotoFile)
    if (!photoUrl) return
    await submitRep('progress', { photo_url: photoUrl, content: progressCaption || null, visibility: progressVis }, XP_VALUES.progress)
  }

  async function handlePrSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prExercise.trim()) { setError('Exercise name is required.'); return }
    if (!prValue || isNaN(Number(prValue))) { setError('Value is required.'); return }
    await submitRep('pr', {
      pr_exercise: prExercise.trim(), pr_value: Number(prValue),
      pr_unit: prUnit, content: prCaption || null, visibility: prVis,
    }, XP_VALUES.pr)
  }

  async function handleCheckinSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!checkinGym.trim()) { setError('Gym name is required.'); return }
    await submitRep('checkin', { gym_name: checkinGym.trim(), content: checkinNote || null, visibility: checkinVis }, XP_VALUES.checkin)
  }

  const xpLabel = activeForm === 'progress' ? XP_VALUES.progress : activeForm === 'pr' ? XP_VALUES.pr : activeForm === 'checkin' ? XP_VALUES.checkin : 0

  // Success state
  if (posted) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔥</div>
        <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text)', marginBottom: '8px' }}>Rep posted!</div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>+{xpLabel} XP earned</div>
      </div>
    )
  }

  const submitBtnStyle: React.CSSProperties = {
    ...btn, width: '100%', padding: '14px',
    backgroundColor: (submitting || uploadingPhoto) ? 'var(--border)' : 'var(--accent)',
    color: (submitting || uploadingPhoto) ? 'var(--text-dim)' : '#000',
    borderRadius: 'var(--radius-md)', fontSize: '15px', fontWeight: 800, marginTop: '8px',
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px 96px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        {activeForm && (
          <button onClick={() => { setActiveForm(null); setError(null) }} style={{
            ...btn, background: 'none', color: 'var(--accent)',
            fontSize: '13px', fontWeight: 600, padding: '0 0 12px',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            ← Back
          </button>
        )}
        <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          {activeForm === 'progress' ? 'Progress Photo' : activeForm === 'pr' ? 'Personal Record' : activeForm === 'checkin' ? 'Check-in' : 'Post a Rep'}
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
          borderRadius: 'var(--radius-sm)', padding: '10px 14px',
          fontSize: '13px', color: 'var(--red)', marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {/* Hub */}
      {!activeForm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { type: null, href: '/browse', icon: '⚡', title: 'Rate a Supplement', sub: 'Browse and rate a flavor', xp: XP_VALUES.rating },
            { type: 'progress' as RepForm, icon: '📸', title: 'Progress Photo', sub: 'Show your gains', xp: XP_VALUES.progress },
            { type: 'pr' as RepForm, icon: '🏋️', title: 'Personal Record', sub: 'Log a new PR', xp: XP_VALUES.pr },
            { type: 'checkin' as RepForm, icon: '📍', title: 'Check-in', sub: 'Where are you training?', xp: XP_VALUES.checkin },
          ].map((item) => {
            const inner = (
              <div style={{
                backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '18px 20px',
                display: 'flex', alignItems: 'center', gap: '16px',
                WebkitTapHighlightColor: 'transparent',
              }}>
                <span style={{ fontSize: '26px', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{item.sub}</div>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: 'var(--accent)',
                  backgroundColor: 'var(--accent-dim)', borderRadius: '999px',
                  padding: '3px 9px', flexShrink: 0,
                  border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                }}>+{item.xp} XP</span>
              </div>
            )
            return item.href ? (
              <Link key={item.title} href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</Link>
            ) : (
              <div
                key={item.title}
                role="button"
                tabIndex={0}
                style={{ cursor: 'pointer' }}
                onClick={() => setActiveForm(item.type)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setActiveForm(item.type)
                  }
                }}
              >{inner}</div>
            )
          })}
        </div>
      )}

      {/* Progress Photo Form */}
      {activeForm === 'progress' && (
        <form onSubmit={handleProgressSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Photo (required)</label>
            {/* Preview area */}
            {progressPhotoPreview && (
              <div style={{ marginBottom: '12px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={progressPhotoPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', display: 'block' }} />
              </div>
            )}
            {/* Two photo buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => progressFileRef.current?.click()}
                style={{
                  ...btn, flex: 1, padding: '12px',
                  backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600,
                  color: 'var(--text-dim)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px',
                }}
              >
                📷 Take Photo
              </button>
              <button
                type="button"
                onClick={() => progressLibraryRef.current?.click()}
                style={{
                  ...btn, flex: 1, padding: '12px',
                  backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600,
                  color: 'var(--text-dim)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px',
                }}
              >
                🖼️ Library
              </button>
            </div>
            {/* Camera input */}
            <input ref={progressFileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setProgressPhotoFile(f); setProgressPhotoPreview(URL.createObjectURL(f)) } }} />
            {/* Library input (no capture attribute) */}
            <input ref={progressLibraryRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setProgressPhotoFile(f); setProgressPhotoPreview(URL.createObjectURL(f)) } }} />
          </div>
          <div>
            <label style={labelStyle}>Caption (optional)</label>
            <textarea value={progressCaption} onChange={(e) => setProgressCaption(e.target.value.slice(0, 280))}
              placeholder="What's the story?" rows={3} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', textAlign: 'right', marginTop: '4px' }}>{progressCaption.length}/280</div>
          </div>
          <VisPicker value={progressVis} onChange={setProgressVis} />
          <button type="submit" style={submitBtnStyle} disabled={submitting || uploadingPhoto}>
            {uploadingPhoto ? 'Uploading photo...' : submitting ? 'Posting...' : `Post Rep · +${XP_VALUES.progress} XP`}
          </button>
        </form>
      )}

      {/* PR Form */}
      {activeForm === 'pr' && (
        <form onSubmit={handlePrSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Exercise (required)</label>
            <input type="text" value={prExercise} onChange={(e) => setPrExercise(e.target.value)}
              placeholder="e.g. Bench Press, Squat..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Value (required)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="number" value={prValue} onChange={(e) => setPrValue(e.target.value)}
                placeholder="0" min="0" step="any" style={{ ...inputStyle, flex: 1 }} />
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
                {(['kg', 'lbs', 'reps'] as const).map((u) => (
                  <button key={u} type="button" onClick={() => setPrUnit(u)} style={{
                    ...btn, padding: '7px 10px', borderRadius: 'var(--radius-sm)',
                    fontSize: '12px', fontWeight: 600,
                    backgroundColor: prUnit === u ? 'var(--accent)' : 'transparent',
                    color: prUnit === u ? '#000' : 'var(--text-dim)',
                  }}>{u}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Caption (optional)</label>
            <textarea value={prCaption} onChange={(e) => setPrCaption(e.target.value.slice(0, 280))}
              placeholder="How did it feel?" rows={3} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', textAlign: 'right', marginTop: '4px' }}>{prCaption.length}/280</div>
          </div>
          <VisPicker value={prVis} onChange={setPrVis} />
          <button type="submit" style={submitBtnStyle} disabled={submitting}>
            {submitting ? 'Posting...' : `Post Rep · +${XP_VALUES.pr} XP`}
          </button>
        </form>
      )}

      {/* Check-in Form */}
      {activeForm === 'checkin' && (
        <form onSubmit={handleCheckinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Gym name (required)</label>
            <input type="text" value={checkinGym} onChange={(e) => setCheckinGym(e.target.value)}
              placeholder="e.g. Gold's Gym, World Class..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Note (optional)</label>
            <textarea value={checkinNote} onChange={(e) => setCheckinNote(e.target.value.slice(0, 280))}
              placeholder="How's the session going?" rows={3} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', textAlign: 'right', marginTop: '4px' }}>{checkinNote.length}/280</div>
          </div>
          <VisPicker value={checkinVis} onChange={setCheckinVis} />
          <button type="submit" style={submitBtnStyle} disabled={submitting}>
            {submitting ? 'Posting...' : `Post Rep · +${XP_VALUES.checkin} XP`}
          </button>
        </form>
      )}

    </div>
  )
}
