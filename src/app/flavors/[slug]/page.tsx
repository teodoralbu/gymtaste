export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFlavorBySlug } from '@/lib/queries'
import { getScoreColor } from '@/lib/constants'
import { ReviewCard } from '@/components/rating/ReviewCard'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function FlavorPage({ params }: Props) {
  const { slug } = await params
  const data = await getFlavorBySlug(slug)

  if (!data) notFound()

  const { flavor, ratings, siblingFlavors } = data
  const product = flavor.product
  const brand = (product as any).brands

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(16px, 4vw, 40px) 16px 80px' }}>

      {/* Sibling flavor picker */}
      {siblingFlavors.length > 0 && (
        <div className="flavor-scroll" style={{
          display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px',
          marginBottom: '20px', scrollbarWidth: 'none', msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}>
          <style>{`.flavor-scroll::-webkit-scrollbar { display: none; }`}</style>
          {siblingFlavors.map((f) => (
            <Link
              key={f.id}
              href={`/flavors/${f.slug}`}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {f.name}
            </Link>
          ))}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '28px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href={`/products/${product.slug}`} style={{ color: 'var(--text-dim)' }}>{product.name}</Link>
        <span style={{ color: 'var(--text-faint)' }}>/</span>
        <span style={{ color: 'var(--text-muted)' }}>{flavor.name}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          {brand?.name} · {product.name}
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 900, margin: '0 0 14px', color: 'var(--text)', lineHeight: 1.1 }}>
          {flavor.name}
        </h1>
        {flavor.tags && flavor.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {flavor.tags.map((tag) => (
              <span key={tag.id} className="tag">{tag.name}</span>
            ))}
          </div>
        )}
      </div>

      {/* Score card */}
      {flavor.avg_overall_score !== null ? (
        <div className="card" style={{
          padding: '28px 32px', marginBottom: '40px',
          display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'center',
          background: `linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)`,
          boxShadow: `var(--shadow-md), var(--glow-accent)`,
        }}>
          <div>
            <div style={{ fontSize: '72px', fontWeight: 900, lineHeight: 1, color: getScoreColor(flavor.avg_overall_score), letterSpacing: '-2px' }}>
              {flavor.avg_overall_score.toFixed(1)}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '6px' }}>
              {flavor.rating_count} {flavor.rating_count === 1 ? 'rating' : 'ratings'}
            </div>
          </div>
          {flavor.would_buy_again_pct !== null && (
            <div>
              <div style={{ fontSize: '44px', fontWeight: 900, lineHeight: 1, color: 'var(--green)' }}>
                {Math.round(flavor.would_buy_again_pct)}%
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '6px' }}>Would buy again</div>
            </div>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <Link href={`/rate/${flavor.slug}`} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '14px' }}>
              Rate this flavor
            </Link>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '28px 32px', marginBottom: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-dim)', margin: '0 0 16px', fontSize: '15px' }}>
            No ratings yet — be the first!
          </p>
          <Link href={`/rate/${flavor.slug}`} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '14px' }}>
            Rate this flavor
          </Link>
        </div>
      )}

      {/* Reviews */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
            Reviews
            {ratings.length > 0 && (
              <span style={{ color: 'var(--text-dim)', fontWeight: 500, fontSize: '14px', marginLeft: '8px' }}>
                {ratings.length}
              </span>
            )}
          </h2>
        </div>

        {ratings.length === 0 ? (
          <p style={{ color: 'var(--text-dim)' }}>No reviews yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ratings.map((rating) => (
              <ReviewCard key={rating.id} rating={rating as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
