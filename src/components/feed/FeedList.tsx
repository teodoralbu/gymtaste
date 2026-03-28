'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import { FeedCard } from '@/components/feed/FeedCard'
import type { FeedItem } from '@/components/feed/FeedCard'
import { loadMoreFeed } from '@/app/actions/feed'

interface FeedListProps {
  initialItems: FeedItem[]
  initialCursor: string | null
  userId?: string
}

export function FeedList({ initialItems, initialCursor, userId }: FeedListProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false) // ref avoids adding loading to useCallback deps
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (!cursor || loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const { items: newItems, nextCursor } = await loadMoreFeed(cursor, userId)
      setItems(prev => [...prev, ...newItems])
      setCursor(nextCursor)
    } catch (err) {
      console.error('Failed to load more feed items:', err)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [cursor, userId])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((feedItem, idx) => (
          <FeedCard key={feedItem.id} item={feedItem} initialLikeCount={0} initialLiked={false} index={idx} />
        ))}
      </div>
      {cursor && (
        <div ref={sentinelRef} style={{ padding: '0 0 20px' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[1, 2].map(i => (
                <div key={i} style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 14, width: '40%', borderRadius: 'var(--radius-sm)', marginBottom: 6 }} />
                      <div className="skeleton" style={{ height: 10, width: '25%', borderRadius: 'var(--radius-sm)' }} />
                    </div>
                  </div>
                  <div className="skeleton" style={{ height: 12, width: '90%', borderRadius: 'var(--radius-sm)', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 'var(--radius-sm)' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
