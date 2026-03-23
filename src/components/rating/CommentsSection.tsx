'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'
import { timeAgo } from '@/lib/timeAgo'

interface Comment {
  id: string
  text: string | null
  created_at: string
  user_id: string
  parent_comment_id: string | null
  is_deleted: boolean
  edited_at: string | null
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

  // Edit/delete state
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)

  // Reply state
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  // Swipe-to-reply state
  const [swipingId, setSwipingId] = useState<string | null>(null)
  const [swipeX, setSwipeX] = useState(0)
  const swipeTriggered = useRef(false)

  const db = useMemo(() => createClient(), [])

  // Body scroll lock — iOS-safe (overflow:hidden alone doesn't work on Safari)
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [open])

  // Reset state on sheet close
  useEffect(() => {
    if (!open) {
      setMenuOpenFor(null)
      setEditingId(null)
      setEditText('')
      setConfirmDeleteId(null)
      setReplyingTo(null)
      setSwipingId(null)
      setSwipeX(0)
    }
  }, [open])

  // Load comments when sheet opens (only once per open)
  const loadComments = useCallback(async () => {
    setLoadingComments(true)
    const { data } = await db
      .from('review_comments')
      .select('id, text, created_at, user_id, parent_comment_id, is_deleted, edited_at')
      .eq('rating_id', ratingId)
      .order('created_at', { ascending: true })

    if (!data || data.length === 0) {
      setComments([])
      setLoadingComments(false)
      return
    }

    const userIds = [...new Set(data.map((c: { user_id: string }) => c.user_id))]
    const { data: users } = await db.from('users').select('id, username, avatar_url').in('id', userIds).returns<{ id: string; username: string; avatar_url: string | null }[]>()
    const userMap: Record<string, { id: string; username: string; avatar_url: string | null }> = {}
    for (const u of (users ?? [])) userMap[u.id] = u

    setComments(data.map((c: { id: string; text: string | null; created_at: string; user_id: string; parent_comment_id: string | null; is_deleted: boolean; edited_at: string | null }) => ({
      id: c.id,
      text: c.text,
      created_at: c.created_at,
      user_id: c.user_id,
      parent_comment_id: c.parent_comment_id,
      is_deleted: c.is_deleted,
      edited_at: c.edited_at,
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

  // Grouped comments for rendering
  const { topLevelComments, repliesByParent } = useMemo(() => {
    const topLevel = comments
      .filter(c => !c.parent_comment_id)
      .slice(0, 20)
    const grouped: Record<string, Comment[]> = {}
    for (const c of comments.filter(c => c.parent_comment_id)) {
      const pid = c.parent_comment_id!
      if (!grouped[pid]) grouped[pid] = []
      grouped[pid].push(c)
    }
    return { topLevelComments: topLevel, repliesByParent: grouped }
  }, [comments])

  // Touch handlers — long-press (owner) + swipe right (all)
  const onTouchStart = (e: React.TouchEvent, commentId: string, isOwner: boolean) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    setSwipingId(commentId)
    setSwipeX(0)
    swipeTriggered.current = false
    if (isOwner) {
      longPressRef.current = setTimeout(() => {
        setMenuOpenFor(commentId)
      }, 500)
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return
    const dx = e.touches[0].clientX - touchStartPos.current.x
    const dy = e.touches[0].clientY - touchStartPos.current.y

    // Cancel long press on any movement
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      if (longPressRef.current) clearTimeout(longPressRef.current)
    }

    // Swipe right — only if mostly horizontal
    if (dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.3 && !swipeTriggered.current) {
      // Rubber band: fast start, slow finish
      const rubberBand = Math.min(dx * 0.55, 72)
      setSwipeX(rubberBand)
    } else if (dx <= 0) {
      setSwipeX(0)
    }
  }

  const onTouchEnd = (comment: Comment) => {
    if (longPressRef.current) clearTimeout(longPressRef.current)

    if (swipeX > 52 && !swipeTriggered.current) {
      swipeTriggered.current = true
      setReplyingTo({ commentId: comment.id, username: comment.user?.username ?? 'anon' })
      setTimeout(() => inputRef.current?.focus(), 50)
    }

    // Snap back
    setSwipeX(0)
    setSwipingId(null)
  }

  // Edit handler
  const handleEditSave = async (commentId: string) => {
    if (!editText.trim()) return
    await db
      .from('review_comments')
      .update({ text: editText.trim(), edited_at: new Date().toISOString() })
      .eq('id', commentId)
    setEditingId(null)
    await loadComments()
  }

  // Delete handler
  const handleDelete = async (comment: Comment) => {
    const hasReplies = comments.some(c => c.parent_comment_id === comment.id && !c.is_deleted)
    if (hasReplies) {
      await db.from('review_comments').update({ is_deleted: true, text: null }).eq('id', comment.id)
    } else {
      await db.from('review_comments').delete().eq('id', comment.id)
    }
    setConfirmDeleteId(null)
    await loadComments()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !text.trim()) return
    setLoading(true)
    setSubmitError('')
    const insertPayload: { rating_id: string; user_id: string; text: string; parent_comment_id?: string } = {
      rating_id: ratingId,
      user_id: user.id,
      text: text.trim().slice(0, 280),
    }
    if (replyingTo) {
      insertPayload.parent_comment_id = replyingTo.commentId
    }
    const { error } = await db.from('review_comments').insert(insertPayload)
    if (!error) {
      setText('')
      setReplyingTo(null)
      await loadComments()
      onCommentPosted?.()
    } else {
      setSubmitError('Failed to post. Try again.')
    }
    setLoading(false)
  }

  // Render a single comment row
  const renderComment = (comment: Comment, isReply: boolean) => {
    const isOwner = comment.user_id === user?.id
    const avatarSize = isReply ? 22 : 28
    const avatarFontSize = isReply ? '9px' : '10px'
    const isSwiping = swipingId === comment.id && swipeX > 0
    const replyIconOpacity = Math.min(swipeX / 52, 1)

    // Deleted comment placeholder
    if (comment.is_deleted) {
      return (
        <div
          key={comment.id}
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '10px',
            animation: 'commentIn 0.2s ease',
            ...(isReply ? { marginLeft: '24px', borderLeft: '2px solid var(--accent)', paddingLeft: '12px' } : {}),
          }}
        >
          <div style={{
            width: `${avatarSize}px`, height: `${avatarSize}px`, borderRadius: '50%',
            backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: avatarFontSize, fontWeight: 800, color: 'var(--text-faint)',
            flexShrink: 0,
          }}>
            ?
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '10px', padding: '7px 10px' }}>
              <div style={{ fontStyle: 'italic', color: 'var(--text-faint)', fontSize: '13px' }}>
                [Comment deleted]
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        key={comment.id}
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: isReply ? '10px' : '12px',
          animation: 'commentIn 0.2s ease',
          position: 'relative',
          ...(isReply ? { marginLeft: '24px', borderLeft: '2px solid var(--accent)', paddingLeft: '12px' } : {}),
        }}
        onTouchStart={(e) => onTouchStart(e, comment.id, isOwner)}
        onTouchMove={onTouchMove}
        onTouchEnd={() => onTouchEnd(comment)}
      >
        {/* Reply arrow — revealed during swipe */}
        {!isReply && (
          <div style={{
            position: 'absolute',
            left: -28,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: replyIconOpacity,
            transition: isSwiping ? 'none' : 'opacity 0.2s ease',
            pointerEvents: 'none',
            color: 'var(--accent)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 17 4 12 9 7" />
              <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
            </svg>
          </div>
        )}

        <Link href={comment.user?.username ? `/users/${comment.user.username}` : '#'} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: `${avatarSize}px`, height: `${avatarSize}px`, borderRadius: '50%',
            backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: avatarFontSize, fontWeight: 800, color: 'var(--accent)', overflow: 'hidden',
            transform: isSwiping ? `translateX(${swipeX}px)` : 'translateX(0)',
            transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}>
            {comment.user?.avatar_url ? (
              <Image src={comment.user.avatar_url} alt={`${comment.user?.username ?? 'User'}'s avatar`} width={avatarSize} height={avatarSize} style={{ objectFit: 'cover' }} />
            ) : (
              comment.user?.username?.[0]?.toUpperCase() ?? '?'
            )}
          </div>
        </Link>

        <div style={{
          flex: 1,
          minWidth: 0,
          position: 'relative',
          transform: isSwiping ? `translateX(${swipeX}px)` : 'translateX(0)',
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}>
          {/* Three-dot menu button */}
          {isOwner && !editingId && (
            <div style={{ position: 'absolute', top: '2px', right: '2px', zIndex: 5 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpenFor(menuOpenFor === comment.id ? null : comment.id)
                }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-faint)', padding: '4px 6px',
                  minWidth: '32px', minHeight: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  WebkitTapHighlightColor: 'transparent',
                }}
                aria-label="Comment options"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {menuOpenFor === comment.id && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, zIndex: 10,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                  overflow: 'hidden', minWidth: '100px',
                  animation: 'menuIn 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transformOrigin: 'top right',
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingId(comment.id)
                      setEditText(comment.text ?? '')
                      setMenuOpenFor(null)
                    }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '10px 14px', fontSize: '13px', fontWeight: 600,
                      color: 'var(--text)', fontFamily: 'inherit',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    Edit
                  </button>
                  <div style={{ height: '1px', background: 'var(--border)' }} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmDeleteId(comment.id)
                      setMenuOpenFor(null)
                    }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '10px 14px', fontSize: '13px', fontWeight: 600,
                      color: '#ef4444', fontFamily: 'inherit',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Comment bubble */}
          {editingId === comment.id ? (
            <div style={{ animation: 'editIn 0.15s ease' }}>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                maxLength={280}
                autoFocus
                style={{
                  width: '100%', background: 'var(--bg-elevated)',
                  border: '1px solid var(--accent)', borderRadius: '8px',
                  padding: '7px 10px', fontSize: '13px', color: 'var(--text)',
                  fontFamily: 'inherit', resize: 'none', outline: 'none',
                  minHeight: '60px', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  onClick={() => handleEditSave(comment.id)}
                  disabled={!editText.trim()}
                  style={{
                    minHeight: '32px', fontSize: '12px', fontWeight: 600,
                    borderRadius: '16px', padding: '4px 12px',
                    border: 'none', cursor: 'pointer',
                    backgroundColor: 'var(--accent)', color: '#000',
                    fontFamily: 'inherit',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  style={{
                    minHeight: '32px', fontSize: '12px', fontWeight: 600,
                    borderRadius: '16px', padding: '4px 12px',
                    border: 'none', cursor: 'pointer',
                    background: 'transparent', color: 'var(--text-dim)',
                    fontFamily: 'inherit',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '10px', padding: '7px 10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px', paddingRight: '28px' }}>
                {comment.user?.username ?? 'anon'}
                <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 400, marginLeft: '6px' }}>
                  {timeAgo(comment.created_at)}
                  {comment.edited_at && ' · edited'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {comment.text}
              </div>
            </div>
          )}

          {/* Delete confirmation */}
          {confirmDeleteId === comment.id && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '12px',
              animation: 'commentIn 0.15s ease',
            }}>
              <span style={{ color: 'var(--text-dim)' }}>Delete this comment?</span>
              <button
                onClick={() => handleDelete(comment)}
                style={{
                  minHeight: '32px', fontSize: '12px', fontWeight: 600,
                  borderRadius: '16px', padding: '4px 12px',
                  border: 'none', cursor: 'pointer',
                  background: 'transparent', color: '#ef4444',
                  fontFamily: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  minHeight: '32px', fontSize: '12px', fontWeight: 600,
                  borderRadius: '16px', padding: '4px 12px',
                  border: 'none', cursor: 'pointer',
                  background: 'transparent', color: 'var(--text-dim)',
                  fontFamily: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Reply button — top-level non-deleted comments only */}
          {!isReply && !comment.is_deleted && editingId !== comment.id && (
            <button
              onClick={() => {
                setReplyingTo({ commentId: comment.id, username: comment.user?.username ?? 'anon' })
                setTimeout(() => inputRef.current?.focus(), 50)
              }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-faint)', fontSize: '11px', fontWeight: 600,
                padding: '4px 0', marginTop: '2px', minHeight: '44px',
                display: 'flex', alignItems: 'center',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Reply
            </button>
          )}
        </div>
      </div>
    )
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <style>{`
        @keyframes commentIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes menuIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes chipIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes editIn {
          from { opacity: 0; transform: scaleY(0.95); }
          to   { opacity: 1; transform: scaleY(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
        aria-label="Close comments"
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
          background: 'var(--bg-card)',
          borderRadius: '16px 16px 0 0',
          minHeight: '50vh', maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', flexShrink: 0 }}>
          <div style={{ width: '32px', height: '4px', borderRadius: '999px', backgroundColor: 'var(--border)' }} />
        </div>

        {/* Sheet header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px 8px', flexShrink: 0,
        }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Comments</span>
          <button
            onClick={onClose}
            aria-label="Close comments"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-dim)', padding: '10px',
              minWidth: '44px', minHeight: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Comments list */}
        <div
          style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 8px', overflowX: 'hidden' }}
          onClick={() => setMenuOpenFor(null)}
        >
          {loadingComments && (
            <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
                animation: 'spin 0.7s linear infinite',
              }} />
            </div>
          )}

          {!loadingComments && topLevelComments.length === 0 && (
            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-faint)', padding: '24px 0', margin: 0 }}>
              No comments yet. Be the first!
            </p>
          )}

          {topLevelComments.map((comment) => {
            const replies = repliesByParent[comment.id] ?? []
            const visibleReplies = expandedReplies.has(comment.id) ? replies : replies.slice(0, 5)
            const hiddenCount = replies.length - 5

            return (
              <div key={comment.id}>
                {renderComment(comment, false)}
                {visibleReplies.map((reply) => renderComment(reply, true))}
                {hiddenCount > 0 && !expandedReplies.has(comment.id) && (
                  <button
                    onClick={() => setExpandedReplies(prev => new Set(prev).add(comment.id))}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-faint)', fontSize: '12px', fontWeight: 600,
                      padding: '4px 0 4px 44px', minHeight: '44px',
                      display: 'flex', alignItems: 'center',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    View {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Input area */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-soft)',
          flexShrink: 0,
        }}>
          {/* Reply chip */}
          {replyingTo && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 16px', fontSize: '12px', color: 'var(--text-dim)',
              background: 'var(--bg-elevated)',
              animation: 'chipIn 0.18s ease',
            }}>
              <span>Replying to @{replyingTo.username}</span>
              <button
                onClick={() => setReplyingTo(null)}
                aria-label="Cancel reply"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-dim)', minWidth: '32px', minHeight: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          <div style={{ padding: '10px 16px', paddingBottom: 'env(safe-area-inset-bottom)' }}>
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
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : 'Add a comment...'}
                    maxLength={280}
                    style={{
                      flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: '20px', padding: '8px 14px', fontSize: '16px',
                      color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
                      transition: 'border-color 0.15s ease',
                      touchAction: 'manipulation',
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
                      transition: 'all 0.15s ease', fontFamily: 'inherit',
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
      </div>
    </>,
    document.body
  )
}

export function CommentsSection({ ratingId, initialCount }: Props) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(initialCount)

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  return (
    <>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {count > 0 ? `${count} comment${count !== 1 ? 's' : ''}` : 'Comment'}
        </button>
      </div>

      <CommentBottomSheet
        open={open}
        onClose={handleClose}
        ratingId={ratingId}
        onCommentPosted={() => setCount((c) => c + 1)}
      />
    </>
  )
}
