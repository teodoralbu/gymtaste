'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'

interface Props {
  ratingId: string
  initialCount: number
  initialLiked: boolean
}

export function LikeButton({ ratingId, initialCount, initialLiked }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(true)
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    if (liked) {
      await db.from('review_likes').delete()
        .eq('user_id', user.id)
        .eq('rating_id', ratingId)
      setLiked(false)
      setCount((c) => c - 1)
    } else {
      await db.from('review_likes').insert({ user_id: user.id, rating_id: ratingId })
      setLiked(true)
      setCount((c) => c + 1)
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        border: liked ? '1px solid #00B4FF44' : '1px solid #2A2A2A',
        backgroundColor: liked ? '#00B4FF14' : 'transparent',
        color: liked ? '#00B4FF' : '#555',
        transition: 'all 0.15s',
      }}
    >
      <span>{liked ? '♥' : '♡'}</span>
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
