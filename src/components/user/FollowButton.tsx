'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'

interface Props {
  targetUserId: string
  initialFollowing: boolean
}

export function FollowButton({ targetUserId, initialFollowing }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  if (user?.id === targetUserId) return null

  async function toggle() {
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(true)
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    if (following) {
      await db.from('follows').delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
      setFollowing(false)
    } else {
      await db.from('follows').insert({
        follower_id: user.id,
        following_id: targetUserId,
      })
      setFollowing(true)
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        padding: '9px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
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
