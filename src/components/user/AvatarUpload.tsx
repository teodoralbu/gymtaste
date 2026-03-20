'use client'

import { useRef, useState } from 'react'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'

interface Props {
  currentAvatarUrl: string | null
  username: string
  tierColor: string
}

export function AvatarUpload({ currentAvatarUrl, username, tierColor }: Props) {
  const { user, refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compress = (file: File): Promise<File> =>
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

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setError(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, or WebP files are allowed.')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.')
      e.target.value = ''
      return
    }

    setUploading(true)
    const compressed = await compress(file)
    const supabase = createClient()
    const path = `avatars/${user.id}/avatar.jpg`

    const { error: uploadError } = await supabase.storage
      .from('review-photos')
      .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('review-photos').getPublicUrl(path)
      const urlWithBust = publicUrl + '?t=' + Date.now()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any).from('users').update({ avatar_url: urlWithBust }).eq('id', user.id)
      if (!updateError) {
        setAvatarUrl(urlWithBust)
        await refreshProfile()
      }
    }

    setUploading(false)
    e.target.value = ''
  }

  return (
    <div
      role="button"
      tabIndex={0}
      style={{ position: 'relative', width: '76px', height: '76px', flexShrink: 0, cursor: 'pointer' }}
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          fileInputRef.current?.click()
        }
      }}
      aria-label="Upload avatar photo"
    >
      {/* Avatar circle */}
      <div style={{
        width: '76px', height: '76px', borderRadius: '50%',
        backgroundColor: 'var(--bg-elevated)',
        border: `2px solid ${tierColor}`,
        boxShadow: `0 0 16px ${tierColor}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px', fontWeight: 900, color: tierColor,
        overflow: 'hidden',
      }}>
        {avatarUrl ? (
          <NextImage src={avatarUrl} alt={username} width={76} height={76} style={{ objectFit: 'cover' }} />
        ) : (
          username[0].toUpperCase()
        )}
      </div>

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        backgroundColor: uploading ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background-color 0.15s',
      }}
        className="avatar-overlay"
      >
        {uploading ? (
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%',
            border: '2px solid #fff', borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
          }} />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ opacity: 0, transition: 'opacity 0.15s' }} className="avatar-edit-icon">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        )}
      </div>

      {error && (
        <p style={{
          position: 'absolute',
          bottom: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '10px',
          color: 'var(--red, #ef4444)',
          whiteSpace: 'nowrap',
          fontWeight: 600,
        }}>
          {error}
        </p>
      )}

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFile} />

      <style>{`
        .avatar-overlay:hover { background-color: rgba(0,0,0,0.45) !important; }
        .avatar-overlay:hover .avatar-edit-icon { opacity: 1 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
