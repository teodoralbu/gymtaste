export const revalidate = 60

import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getFlavorBySlug } from '@/lib/queries'
import { getScoreColor } from '@/lib/constants'
import { ReviewCard } from '@/components/rating/ReviewCard'
import { StickyRateCTA } from './StickyRateCTA'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getFlavorBySlug(slug)
  if (!data) return {}
  const { flavor } = data
  const product = flavor.product
  const brand = (product as unknown as { brands?: { name: string } }).brands
  const score = flavor.avg_overall_score !== null ? ` · ${flavor.avg_overall_score.toFixed(1)}/10` : ''
  return {
    title: `${flavor.name} — ${product.name} | GymTaste`,
    description: `Community ratings for ${flavor.name} by ${brand?.name ?? product.name}${score}. ${flavor.rating_count} review${flavor.rating_count !== 1 ? 's' : ''} from real lifters.`,
  }
}

export default async function FlavorPage({ params }: Props) {
  const { slug } = await params
  const data = await getFlavorBySlug(slug)

  if (!data) notFound()

  const { flavor, ratings, siblingFlavors } = data
  const product = flavor.product
  const brand = (product as unknown as { brands?: { name: string } }).brands

  // Get ratings count from last 7 days
  const supabase = await (await import('@/lib/supabase-server')).createServerSupabaseClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: weeklyCount } = await supabase
    .from('ratings')
    .select('id', { count: 'exact', head: true })
    .eq('flavor_id', flavor.id)
    .eq('schema_version', 2)
    .gte('created_at', sevenDaysAgo)
  const thisWeekCount = weeklyCount ?? 0

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(16px, 4vw, 40px) 16px', paddingBottom: 'max(96px, calc(96px + env(safe-area-inset-bottom)))' }}>

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
            {thisWeekCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                <span
                  className="soft-pulse"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {thisWeekCount} rated this week
                </span>
              </div>
            )}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ratings.map((rating) => (
              <ReviewCard key={rating.id} rating={rating} />
            ))}
          </div>
        )}
      </div>

      <StickyRateCTA slug={flavor.slug} />
    </div>
  )
}
