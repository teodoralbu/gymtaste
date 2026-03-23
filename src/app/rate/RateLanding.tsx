'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  image_url: string | null
  brands: { name: string } | null
}

interface Props {
  products: Product[]
}

export function RateLanding({ products }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Slight delay so keyboard doesn't immediately pop on page enter
    const t = setTimeout(() => inputRef.current?.focus(), 200)
    return () => clearTimeout(t)
  }, [])

  const q = query.toLowerCase().trim()
  const filtered = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brands?.name ?? '').toLowerCase().includes(q)
      )
    : products

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) 16px 96px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: 'clamp(24px, 6vw, 36px)',
          fontWeight: 900,
          margin: '0 0 6px',
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          Rate a Flavor
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)', lineHeight: 1.5 }}>
          What did you try today? Find it and rate it.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
          style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-faint)', pointerEvents: 'none',
          }}
        >
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brand or product..."
          style={{
            width: '100%',
            height: '48px',
            paddingLeft: '42px',
            paddingRight: '16px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '15px',
            color: 'var(--text)',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-faint)', padding: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-faint)', fontSize: '14px' }}>
          No products found for &ldquo;{query}&rdquo;
          <div style={{ marginTop: '16px' }}>
            <Link href="/submit" style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 600 }}>
              Submit a product →
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                transition: 'background-color 150ms ease, border-color 150ms ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-elevated)'
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hover, var(--accent))'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-card)'
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
              }}
              >
                {/* Product image */}
                <div style={{
                  width: '96px', height: '96px', borderRadius: '10px', flexShrink: 0,
                  backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  overflow: 'hidden',
                }}>
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt={`${product.name} by ${product.brands?.name ?? 'Unknown'}`}
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                    />
                  ) : (
                    <span style={{ fontSize: '18px' }}>⚡</span>
                  )}
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px', fontWeight: 700, color: 'var(--text)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: '2px',
                  }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)', fontWeight: 500 }}>
                    {product.brands?.name ?? ''}
                  </div>
                </div>

                {/* Chevron */}
                <div style={{ color: 'var(--text-faint)', flexShrink: 0, fontSize: '18px', lineHeight: 1 }}>›</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
