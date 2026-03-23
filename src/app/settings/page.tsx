'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { PageContainer } from '@/components/layout/PageContainer'
import { MAX_BIO_LENGTH, FITNESS_GOALS } from '@/lib/constants'
import type { FitnessGoal } from '@/lib/types'

export default function SettingsPage() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    username: profile?.username ?? '',
    bio: profile?.bio ?? '',
  })
  const [bodyStats, setBodyStats] = useState({
    height_cm: profile?.height_cm?.toString() ?? '',
    weight_kg: profile?.weight_kg?.toString() ?? '',
    fitness_goal: (profile?.fitness_goal as FitnessGoal | null) ?? ('' as FitnessGoal | ''),
  })
  const [savingStats, setSavingStats] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  if (!profile || !user) {
    return (
      <PageContainer className="py-20" narrow>
        <div className="flex justify-center">
          <div className="w-6 h-6 border-2 border-[#00B4FF] border-t-transparent rounded-full animate-spin" />
        </div>
      </PageContainer>
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.username.length < 3) return setError('Username must be at least 3 characters.')
    if (!/^[a-z0-9_.]+$/.test(form.username))
      return setError('Username can only contain lowercase letters, numbers, underscores, and dots.')

    setSaving(true)

    if (form.username !== profile.username) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', form.username)
        .maybeSingle()
      if (existing) {
        setSaving(false)
        return setError('Username already taken.')
      }
    }

    const { error } = await supabase
      .from('users')
      .update({ username: form.username, bio: form.bio || null })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      await refreshProfile()
      setSuccess('Profile updated.')
    }
  }

  const compressAvatar = (file: File): Promise<File> =>
    new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const SIZE = 256
        const canvas = document.createElement('canvas')
        canvas.width = SIZE; canvas.height = SIZE
        const ctx = canvas.getContext('2d')!
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE)
        canvas.toBlob(
          (blob) => resolve(new File([blob!], 'avatar.jpg', { type: 'image/jpeg' })),
          'image/jpeg', 0.88
        )
      }
      img.src = URL.createObjectURL(file)
    })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      return setError('Only JPG, PNG, or WebP files are allowed.')
    if (file.size > 5 * 1024 * 1024) return setError('File must be under 5MB.')

    setUploadingAvatar(true)
    setError('')
    e.target.value = ''

    const compressed = await compressAvatar(file)
    const path = `avatars/${user.id}/avatar.jpg`

    const { error: uploadError } = await supabase.storage
      .from('review-photos')
      .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })

    if (uploadError) {
      setUploadingAvatar(false)
      return setError(uploadError.message)
    }

    const { data: { publicUrl } } = supabase.storage.from('review-photos').getPublicUrl(path)
    const urlWithBust = publicUrl + '?t=' + Date.now()

    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: urlWithBust })
      .eq('id', user.id)

    setUploadingAvatar(false)
    if (updateError) {
      setError(updateError.message)
    } else {
      await refreshProfile()
      setSuccess('Avatar updated.')
    }
  }

  const handleSaveBodyStats = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const height = bodyStats.height_cm ? parseFloat(bodyStats.height_cm) : null
    const weight = bodyStats.weight_kg ? parseFloat(bodyStats.weight_kg) : null
    const goal = bodyStats.fitness_goal || null

    if (height !== null && (height < 100 || height > 250))
      return setError('Height must be between 100 and 250 cm.')
    if (weight !== null && (weight < 30 || weight > 300))
      return setError('Weight must be between 30 and 300 kg.')

    setSavingStats(true)

    const { error } = await supabase
      .from('users')
      .update({
        height_cm: height,
        weight_kg: weight,
        fitness_goal: goal,
      })
      .eq('id', user.id)

    setSavingStats(false)
    if (error) {
      setError(error.message)
    } else {
      await refreshProfile()
      setSuccess('Body stats updated.')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <PageContainer className="pt-12 pb-24" narrow>
      <h1 className="text-2xl font-black mb-8">Settings</h1>

      {/* Avatar */}
      <section className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-dim)' }}>Avatar</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--accent)' }}>
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={`${profile.username}'s avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              profile.username?.[0]?.toUpperCase() ?? '?'
            )}
          </div>
          <div>
            <Button
              variant="secondary"
              size="sm"
              loading={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="min-h-11"
            >
              Upload photo
            </Button>
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-dim)' }}>JPG, PNG, WebP · Max 5MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
      </section>

      {/* Profile form */}
      <section className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-dim)' }}>Profile</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
            hint="Lowercase letters, numbers, underscores, and dots only"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={MAX_BIO_LENGTH}
              placeholder="Tell the community about yourself..."
              rows={3}
              className="input"
              style={{ resize: 'none', fontFamily: 'inherit' }}
            />
            <p className="text-xs text-right" style={{ color: 'var(--text-dim)' }}>
              {form.bio.length}/{MAX_BIO_LENGTH}
            </p>
          </div>

          {error && (
            <p className="text-sm text-[#FF3D00] bg-[#FF3D0014] border border-[#FF3D0033] rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-[#00E676] bg-[#00E67614] border border-[#00E67633] rounded-lg px-4 py-2.5">
              {success}
            </p>
          )}

          <Button type="submit" loading={saving} className="self-start">
            Save changes
          </Button>
        </form>
      </section>

      {/* Body Stats */}
      <section className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-dim)' }}>Body Stats</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Used for personalized supplement dosage recommendations on product pages.
        </p>
        <form onSubmit={handleSaveBodyStats} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                label="Height (cm)"
                type="number"
                min={100}
                max={250}
                value={bodyStats.height_cm}
                onChange={(e) => setBodyStats({ ...bodyStats, height_cm: e.target.value })}
                placeholder="175"
              />
            </div>
            <div className="flex-1">
              <Input
                label="Weight (kg)"
                type="number"
                min={30}
                max={300}
                value={bodyStats.weight_kg}
                onChange={(e) => setBodyStats({ ...bodyStats, weight_kg: e.target.value })}
                placeholder="80"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Fitness Goal</label>
            <select
              value={bodyStats.fitness_goal}
              onChange={(e) => setBodyStats({ ...bodyStats, fitness_goal: e.target.value as FitnessGoal | '' })}
              className="input"
              style={{ fontFamily: 'inherit', minHeight: '44px' }}
            >
              <option value="">Select a goal...</option>
              {FITNESS_GOALS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <Button type="submit" loading={savingStats} className="self-start">
            Save body stats
          </Button>
        </form>
      </section>

      {/* Badge */}
      <section className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-dim)' }}>
          Your Badge
        </h2>
        <Badge tier={profile.badge_tier} size="lg" />
      </section>

      {/* Account */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-dim)' }}>Account</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
        <Button variant="danger" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </section>
    </PageContainer>
  )
}
