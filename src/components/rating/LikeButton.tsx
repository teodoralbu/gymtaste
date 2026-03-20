'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'
import { useToast } from '@/context/ToastContext'

interface Props {
  targetId: string
  targetTable: 'review_likes' | 'rep_likes'
  targetColumn: 'rating_id' | 'rep_id'
  initialCount: number
  initialLiked: boolean
}

export function LikeButton({ targetId, targetTable, targetColumn, initialCount, initialLiked }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [animating, setAnimating] = useState(false)

  const db = useMemo(() => createClient(), [])

  async function toggle() {
    if (!user) {
      router.push('/login')
      return
    }
    if (loading) return

    navigator.vibrate?.(30)
    setLoading(true)

    // Optimistic update
    const wasLiked = liked
    const prevCount = count
    if (wasLiked) {
      setLiked(false)
      setCount((c: number) => c - 1)
    } else {
      setLiked(true)
      setCount((c: number) => c + 1)
      setAnimating(true)
      setTimeout(() => setAnimating(false), 300)
    }

    if (wasLiked) {
      const { error } = await db.from(targetTable).delete()
        .eq('user_id', user.id)
        .eq(targetColumn, targetId)
      if (error) {
        // Revert on failure
        setLiked(wasLiked)
        setCount(prevCount)
        showToast('Failed to unlike')
      } else {
        showToast('Unliked')
      }
    } else {
      const { error } = await (targetTable === 'review_likes'
        ? db.from('review_likes').insert({ user_id: user.id, rating_id: targetId })
        : db.from('rep_likes').insert({ user_id: user.id, rep_id: targetId }))
      if (error) {
        // Revert on failure
        setLiked(wasLiked)
        setCount(prevCount)
        showToast('Failed to like')
      } else {
        showToast('❤️ Liked')
      }
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '10px 12px', minHeight: '44px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        border: liked ? '1px solid #00B4FF44' : '1px solid var(--border)',
        backgroundColor: liked ? '#00B4FF14' : 'transparent',
        color: liked ? '#00B4FF' : 'var(--text-dim)',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span className={animating ? 'heart-pop' : undefined} style={{ display: 'inline-block' }}>
        {liked ? '♥' : '♡'}
      </span>
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
