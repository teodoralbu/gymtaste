'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { getScoreColor } from '@/lib/constants'

type LeaderboardItem = {
  rank: number
  flavor_id: string
  name: string
  slug: string
  flavor_image_url: string | null
  tags: { id: string; name: string; slug: string }[]
  avg_overall_score: number
  rating_count: number
  would_buy_again_pct: number
  product: { name: string; brands: { name: string } | null }
}

const TABS = [
  { key: 'overall',      label: 'Overall' },
  { key: 'flavor',       label: 'Flavor' },
  { key: 'pump',         label: 'Pump' },
  { key: 'energy_focus', label: 'Energy' },
  { key: 'value',        label: 'Value' },
]

const PODIUM_ACCENTS: Record<number, { color: string; glow: string }> = {
  1: { color: '#FFD700', glow: 'rgba(255,215,0,0.15)' },
  2: { color: '#C0C0C0', glow: 'rgba(192,192,192,0.10)' },
  3: { color: '#CD7F32', glow: 'rgba(205,127,50,0.12)' },
}

interface Props {
  allData: LeaderboardItem[][]
}

export function SwipeableLeaderboard({ allData }: Props) {
  const n = allData.length // 5

  // Triple for infinite loop — start in middle copy
  const tripleData = [...allData, ...allData, ...allData]

  const [activeIndex, setActiveIndex] = useState(n)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [noTransition, setNoTransition] = useState(false)

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isHorizontal = useRef<boolean | null>(null)

  // Which logical tab (0-4) is currently shown
  const actualTab = activeIndex % n

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
    if (isHorizontal.current) {
      if (dragOffset < -60) {
        setActiveIndex(i => i + 1)
      } else if (dragOffset > 60) {
        setActiveIndex(i => i - 1)
      }
    }
    setDragOffset(0)
    isHorizontal.current = null
  }

  function handleTransitionEnd() {
    // Silently jump back to middle copy so infinite wrap is seamless
    if (activeIndex < n || activeIndex >= 2 * n) {
      setNoTransition(true)
      setActiveIndex(i => {
        if (i < n) return i + n
        if (i >= 2 * n) return i - n
        return i
      })
      requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)))
    }
  }

  return (
    <div>
      {/* ── Tab pills — sticky so they stay visible while scrolling the list ── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: 'var(--bg)',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingLeft: '16px',
        paddingTop: '10px',
        paddingBottom: '10px',
        marginBottom: '8px',
        marginLeft: '-16px',
        marginRight: '-16px',
        scrollbarWidth: 'none',
      }}>
        {TABS.map((tab, i) => {
          const isActive = i === actualTab
          return (
            <button
              key={tab.key}
              // Always navigate to the middle-copy position of that tab
              onClick={() => setActiveIndex(n + i)}
              style={{
                flexShrink: 0,
                padding: '7px 16px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 700,
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-elevated)',
                color: isActive ? '#000' : 'var(--text-dim)',
                cursor: 'pointer',
                transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              {tab.label}
            </button>
          )
        })}
        <div style={{ width: '16px', flexShrink: 0 }} aria-hidden="true" />
      </div>

      {/* ── Swipe rail — full viewport width so clipping happens at natural edges ── */}
      <div
        style={{ overflow: 'hidden', touchAction: 'pan-y', marginLeft: '-16px', marginRight: '-16px' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            display: 'flex',
            transform: `translateX(calc(${-activeIndex * 100}% + ${dragOffset}px))`,
            transition: isDragging || noTransition
              ? 'none'
              : 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            willChange: 'transform',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {tripleData.map((items, panelIdx) => (
            <div
              key={panelIdx}
              style={{ minWidth: '100%', width: '100%', padding: '0 16px', boxSizing: 'border-box' }}
              aria-hidden={panelIdx !== activeIndex}
            >
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No ratings yet</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Flavors appear here once they receive ratings.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((item) => {
                    const podium = PODIUM_ACCENTS[item.rank]
                    const isPodium = item.rank <= 3
                    return (
                      <Link
                        key={item.flavor_id}
                        href={`/flavors/${item.slug}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <div
                          className="card-hover card-press"
                          style={{
                            backgroundColor: isPodium ? 'var(--bg-elevated)' : 'var(--bg-card)',
                            border: isPodium ? `1px solid ${podium.color}40` : '1px solid var(--border)',
                            borderRadius: isPodium ? 'var(--radius-lg)' : 'var(--radius-md)',
                            padding: isPodium ? '20px 24px' : '14px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            boxShadow: isPodium ? `0 0 24px ${podium.glow}` : 'none',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {isPodium && (
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: podium.color, borderRadius: '3px 0 0 3px' }} />
                          )}

                          <div style={{ width: isPodium ? '36px' : '30px', textAlign: 'center', flexShrink: 0 }}>
                            {isPodium ? (
                              <span style={{ fontSize: '20px', lineHeight: 1 }}>
                                {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                              </span>
                            ) : (
                              <span style={{ fontSize: '13px', fontWeight: 700, color: item.rank <= 10 ? 'var(--text-dim)' : 'var(--text-faint)' }}>
                                #{item.rank}
                              </span>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                              {item.product.brands?.name ?? ''} · {item.product.name}
                            </div>
                            <div style={{ fontSize: isPodium ? '17px' : '15px', fontWeight: isPodium ? 800 : 700, color: 'var(--text)', marginBottom: item.tags?.length ? '6px' : 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.name}
                            </div>
                            {item.tags && item.tags.length > 0 && (
                              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {item.tags.slice(0, 4).map((tag) => (
                                  <span key={tag.id} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-dim)', border: '1px solid var(--border-soft)', fontWeight: 500 }}>
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: isPodium ? '32px' : '26px', fontWeight: 900, color: getScoreColor(item.avg_overall_score), lineHeight: 1, marginBottom: '4px', letterSpacing: '-0.02em' }}>
                              {item.avg_overall_score.toFixed(1)}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginBottom: item.would_buy_again_pct != null ? '3px' : 0 }}>
                              {item.rating_count} {item.rating_count === 1 ? 'rating' : 'ratings'}
                            </div>
                            {item.would_buy_again_pct != null && (
                              <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>
                                {Math.round(item.would_buy_again_pct)}% WBA
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Swipe indicator dots ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '24px' }}>
        {TABS.map((_, i) => (
          <div
            key={i}
            onClick={() => setActiveIndex(n + i)}
            style={{
              width: i === actualTab ? '20px' : '6px',
              height: '6px',
              borderRadius: '999px',
              backgroundColor: i === actualTab ? 'var(--accent)' : 'var(--border)',
              transition: 'width 0.25s ease, background-color 0.25s ease',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  )
}
