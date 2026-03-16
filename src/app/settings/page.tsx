'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { PageContainer } from '@/components/layout/PageContainer'
import { MAX_BIO_LENGTH } from '@/lib/constants'

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
    if (!/^[a-z0-9_]+$/.test(form.username))
      return setError('Username can only contain lowercase letters, numbers, and underscores.')

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      return setError('Only JPG, PNG, or WebP files are allowed.')
    if (file.size > 5 * 1024 * 1024) return setError('File must be under 5MB.')

    setUploadingAvatar(true)
    setError('')

    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setUploadingAvatar(false)
      return setError(uploadError.message)
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(path)

    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    setUploadingAvatar(false)
    if (updateError) {
      setError(updateError.message)
    } else {
      await refreshProfile()
      setSuccess('Avatar updated.')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <PageContainer className="py-12" narrow>
      <h1 className="text-2xl font-black mb-8">Settings</h1>

      {/* Avatar */}
      <section className="mb-8 pb-8 border-b border-[#2A2A2A]">
        <h2 className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-4">Avatar</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] overflow-hidden flex items-center justify-center text-xl font-bold text-[#00B4FF] flex-shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              profile.username[0].toUpperCase()
            )}
          </div>
          <div>
            <Button
              variant="secondary"
              size="sm"
              loading={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload photo
            </Button>
            <p className="text-xs text-[#555] mt-1.5">JPG, PNG, WebP · Max 5MB</p>
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
      <section className="mb-8 pb-8 border-b border-[#2A2A2A]">
        <h2 className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-4">Profile</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
            hint="Lowercase letters, numbers, underscores only"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={MAX_BIO_LENGTH}
              placeholder="Tell the community about yourself..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2A2A2A] text-white placeholder-[#555] text-sm outline-none focus:border-[#00B4FF] transition-colors resize-none"
            />
            <p className="text-xs text-[#555] text-right">
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

      {/* Badge */}
      <section className="mb-8 pb-8 border-b border-[#2A2A2A]">
        <h2 className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-4">
          Your Badge
        </h2>
        <Badge tier={profile.badge_tier} size="lg" />
      </section>

      {/* Account */}
      <section>
        <h2 className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-4">Account</h2>
        <p className="text-sm text-[#666] mb-4">{user.email}</p>
        <Button variant="danger" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </section>
    </PageContainer>
  )
}
