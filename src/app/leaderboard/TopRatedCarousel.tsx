'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getScoreColor } from '@/lib/constants'

const CARD_W = 120
const GAP = 10
const STEP = CARD_W + GAP // 130px per slide

type CarouselItem = {
  flavor_id: string
  slug: string
  name: string
  rank: number
  avg_overall_score: number
  flavor_image_url: string | null
  product: {
    image_url?: string | null
    name: string
    brands: { name: string } | null
  }
}

export function TopRatedCarousel({ items }: { items: CarouselItem[] }) {
  const n = items.length
  if (n === 0) return null

  // Triple items for infinite loop: [copy A | copy B (start) | copy C]
  const all = [...items, ...items, ...items]

  // Start at index n = first card of middle copy
  const [idx, setIdx] = useState(n)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [noTransition, setNoTransition] = useState(false)

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isHorizontal = useRef<boolean | null>(null)

  // card at `idx` aligns to 16px from the left edge of the full-bleed container
  const translateX = -(idx * STEP) + 16 + dragOffset

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isHorizontal.current = null
    setIsDragging(true)
    setDragOffset(0)
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    if (isHorizontal.current === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      isHorizontal.current = Math.abs(dx) > Math.abs(dy)
    }

    if (!isHorizontal.current) return
    e.preventDefault()
    setDragOffset(dx)
  }

  function handleTouchEnd() {
    setIsDragging(false)
    isHorizontal.current = null

    if (dragOffset < -40) {
      setIdx(i => i + 1)
    } else if (dragOffset > 40) {
      setIdx(i => i - 1)
    }
    setDragOffset(0)
  }

  function handleTransitionEnd() {
    // Silently jump back to the middle copy so the loop is seamless
    if (idx < n || idx >= 2 * n) {
      setNoTransition(true)
      setIdx(i => {
        if (i < n) return i + n
        if (i >= 2 * n) return i - n
        return i
      })
      // Re-enable transition after two frames so the silent jump has painted
      requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)))
    }
  }

  return (
    // Break out of page's 16px horizontal padding so cards reach the viewport edge
    <div style={{ overflow: 'hidden', margin: '0 -16px' }}>
      <div
        style={{
          display: 'flex',
          gap: `${GAP}px`,
          transform: `translateX(${translateX}px)`,
          transition: isDragging || noTransition
            ? 'none'
            : 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTransitionEnd={handleTransitionEnd}
      >
        {all.map((item, i) => {
          const imgSrc = item.flavor_image_url ?? item.product.image_url ?? null
          return (
            <div key={`${item.flavor_id}-${i}`} style={{ flexShrink: 0, width: `${CARD_W}px` }}>
              <Link href={`/flavors/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <div style={{ position: 'relative', width: `${CARD_W}px`, height: '140px', flexShrink: 0 }}>
                    {imgSrc ? (
                      <Image src={imgSrc} alt={item.name} fill style={{ objectFit: 'cover' }} sizes={`${CARD_W}px`} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(160deg, color-mix(in srgb, var(--accent) 30%, var(--bg-elevated)) 0%, color-mix(in srgb, var(--accent) 10%, var(--bg-elevated)) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)', opacity: 0.5, letterSpacing: '-0.03em' }}>
                          {(item.product.brands?.name ?? item.name)[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {item.rank <= 3 && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '14px', lineHeight: 1 }}>
                        {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '10px 10px 12px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: getScoreColor(item.avg_overall_score), lineHeight: 1, marginBottom: '5px', letterSpacing: '-0.02em' }}>
                      {item.avg_overall_score.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '4px' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {item.product.brands?.name}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
