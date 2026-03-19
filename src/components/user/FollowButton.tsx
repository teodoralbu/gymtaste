'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'
import { useToast } from '@/context/ToastContext'

interface Props {
  targetUserId: string
  initialFollowing: boolean
}

export function FollowButton({ targetUserId, initialFollowing }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  if (user?.id === targetUserId) return null

  async function toggle() {
    if (!user) {
      router.push('/login')
      return
    }
    if (loading) return

    // Optimistic update
    const wasFollowing = following
    setFollowing(!following)
    setLoading(true)

    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    if (wasFollowing) {
      const { error } = await db
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
      if (error) {
        setFollowing(wasFollowing)
        showToast('Could not unfollow. Try again.')
      }
    } else {
      const { error } = await db.from('follows').insert({
        follower_id: user.id,
        following_id: targetUserId,
      })
      if (error) {
        setFollowing(wasFollowing)
        showToast('Could not follow. Try again.')
      }
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        padding: '9px 24px', minHeight: '44px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        border: following ? '1px solid #2A2A2A' : '1px solid #00B4FF',
        backgroundColor: following ? '#1E1E1E' : '#00B4FF',
        color: following ? '#A0A0A0' : '#000',
        transition: 'all 0.15s',
      }}
    >
      {loading ? '…' : following ? 'Following' : 'Follow'}
    </button>
  )
}
