'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getScoreColor } from '@/lib/constants'

const CARD_W = 120
const GAP = 10
const ITEM_W = CARD_W + GAP // 130px per slot

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

  // Triple for infinite feel: [copy A | copy B (start here) | copy C]
  const all = [...items, ...items, ...items]

  const scrollRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialise scroll position at middle copy so user can scroll both directions
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = n * ITEM_W
  }, [n])

  // After scroll settles, silently reset to middle copy — seamless infinite wrap
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        const total = n * ITEM_W
        if (el.scrollLeft < total) {
          el.scrollLeft += total
        } else if (el.scrollLeft >= 2 * total) {
          el.scrollLeft -= total
        }
      }, 150)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [n])

  return (
    // Break out of page's 16px horizontal padding so cards reach the viewport edge
    <div style={{ margin: '0 -16px' }}>
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: `${GAP}px`,
          overflowX: 'scroll',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        {all.map((item, i) => {
          const imgSrc = item.flavor_image_url ?? item.product.image_url ?? null
          return (
            <div
              key={`${item.flavor_id}-${i}`}
              style={{ flexShrink: 0, width: `${CARD_W}px`, scrollSnapAlign: 'start' }}
            >
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
