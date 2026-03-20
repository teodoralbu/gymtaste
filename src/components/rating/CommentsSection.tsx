'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'
import { timeAgo } from '@/lib/timeAgo'

interface Comment {
  id: string
  text: string
  created_at: string
  user: { username: string; avatar_url: string | null } | null
}

interface Props {
  ratingId: string
  initialCount: number
}

function CommentBottomSheet({
  open,
  onClose,
  ratingId,
  onCommentPosted,
}: {
  open: boolean
  onClose: () => void
  ratingId: string
  onCommentPosted?: () => void
}) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [hasLoaded, setHasLoaded] = useState(false)

  const db = useMemo(() => createClient(), [])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Load comments when sheet opens (only once per open)
  const loadComments = useCallback(async () => {
    setLoadingComments(true)
    const { data } = await db
      .from('review_comments')
      .select('id, text, created_at, user_id')
      .eq('rating_id', ratingId)
      .order('created_at', { ascending: true })
      .limit(20)

    if (!data || data.length === 0) {
      setComments([])
      setLoadingComments(false)
      return
    }

    const userIds = [...new Set(data.map((c: { user_id: string }) => c.user_id))]
    const { data: users } = await db.from('users').select('id, username, avatar_url').in('id', userIds).returns<{ id: string; username: string; avatar_url: string | null }[]>()
    const userMap: Record<string, { id: string; username: string; avatar_url: string | null }> = {}
    for (const u of (users ?? [])) userMap[u.id] = u

    setComments(data.map((c: { id: string; text: string; created_at: string; user_id: string }) => ({
      id: c.id,
      text: c.text,
      created_at: c.created_at,
      user: userMap[c.user_id] ?? null,
    })))
    setLoadingComments(false)
  }, [db, ratingId])

  useEffect(() => {
    if (open && !hasLoaded) {
      setHasLoaded(true)
      loadComments()
    }
  }, [open, hasLoaded, loadComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !text.trim()) return
    setLoading(true)
    setSubmitError('')
    const { error } = await db.from('review_comments').insert({
      rating_id: ratingId,
      user_id: user.id,
      text: text.trim().slice(0, 280),
    })
    if (!error) {
      setText('')
      await loadComments()
      onCommentPosted?.()
    } else {
      setSubmitError('Failed to post. Try again.')
    }
    setLoading(false)
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      {/* Full-screen overlay / backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(0,0,0,0.5)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 201,
          background: 'var(--bg-card)',
          borderRadius: '16px 16px 0 0',
          minHeight: '50vh',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', flexShrink: 0 }}>
          <div style={{
            width: '32px',
            height: '4px',
            borderRadius: '999px',
            backgroundColor: 'var(--border)',
          }} />
        </div>

        {/* Sheet header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px 8px',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Comments</span>
          <button
            onClick={onClose}
            aria-label="Close comments"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-dim)',
              padding: '10px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Comments list — scrollable middle area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 8px' }}>
          {loadingComments && (
            <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
                animation: 'spin 0.7s linear infinite',
              }} />
            </div>
          )}

          {!loadingComments && comments.length === 0 && (
            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-faint)', padding: '24px 0', margin: 0 }}>
              No comments yet. Be the first!
            </p>
          )}

          {comments.map((comment) => (
            <div key={comment.id} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <Link href={comment.user?.username ? `/users/${comment.user.username}` : '#'} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 800, color: 'var(--accent)', overflow: 'hidden',
                }}>
                  {comment.user?.avatar_url ? (
                    <Image src={comment.user.avatar_url} alt="" width={28} height={28} style={{ objectFit: 'cover' }} />
                  ) : (
                    comment.user?.username?.[0]?.toUpperCase() ?? '?'
                  )}
                </div>
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '10px', padding: '7px 10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>
                    {comment.user?.username ?? 'anon'}
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 400, marginLeft: '6px' }}>
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {comment.text}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input form — sticky at bottom */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-soft)',
          padding: '10px 16px',
          paddingBottom: 'env(safe-area-inset-bottom)',
          flexShrink: 0,
        }}>
          {user ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {submitError && (
                <p style={{ fontSize: '12px', color: 'var(--red)', margin: 0 }}>{submitError}</p>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 800, color: 'var(--accent)',
                }}>
                  {profile?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Add a comment..."
                  maxLength={280}
                  style={{
                    flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: '20px', padding: '8px 14px', fontSize: '16px',
                    color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <button
                  type="submit"
                  disabled={!text.trim() || loading}
                  style={{
                    padding: '8px 14px', borderRadius: '20px', fontSize: '12px',
                    fontWeight: 700, border: 'none', cursor: 'pointer',
                    backgroundColor: text.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: text.trim() ? '#000' : 'var(--text-faint)',
                    transition: 'all 0.15s', fontFamily: 'inherit',
                    WebkitTapHighlightColor: 'transparent',
                    flexShrink: 0,
                  }}
                >
                  {loading ? '...' : 'Post'}
                </button>
              </div>
            </form>
          ) : (
            <Link href="/login" style={{ fontSize: '13px', color: 'var(--accent)', display: 'block', textAlign: 'center', padding: '4px 0' }}>
              Log in to comment
            </Link>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}

export function CommentsSection({ ratingId, initialCount }: Props) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(initialCount)

  // Keep count in sync: when sheet closes after a submit, the
  // loadComments inside the sheet already refreshes comments.
  // We expose a callback so the sheet can bump the count.
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  return (
    <>
      {/* Trigger button — lives on the card */}
      <div style={{ borderTop: '1px solid var(--border-soft)' }}>
        <button
          onClick={handleOpen}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 16px', minHeight: '44px', background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-dim)', fontSize: '13px',
            fontWeight: 600, fontFamily: 'inherit',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {count > 0 ? `${count} comment${count !== 1 ? 's' : ''}` : 'Comment'}
        </button>
      </div>

      {/* Bottom sheet rendered into document.body via portal */}
      <CommentBottomSheet
        open={open}
        onClose={handleClose}
        ratingId={ratingId}
        onCommentPosted={() => setCount((c) => c + 1)}
      />
    </>
  )
}
