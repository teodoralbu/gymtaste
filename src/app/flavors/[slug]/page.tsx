export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFlavorBySlug } from '@/lib/queries'
import { getScoreColor, RATING_DIMENSIONS } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import { LikeButton } from '@/components/rating/LikeButton'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function FlavorPage({ params }: Props) {
  const { slug } = await params
  const data = await getFlavorBySlug(slug)

  if (!data) notFound()

  const { flavor, ratings } = data
  const product = flavor.product
  const brand = (product as any).brands

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(16px, 4vw, 40px) 16px 80px' }}>

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
              <div key={rating.id} className="card" style={{ padding: '20px 24px' }}>

                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Avatar */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, var(--accent-glow), var(--bg-elevated))`,
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '15px', fontWeight: 800, color: 'var(--accent)',
                      overflow: 'hidden',
                    }}>
                      {rating.user?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={rating.user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        rating.user?.username?.[0]?.toUpperCase() ?? '?'
                      )}
                    </div>
                    <div>
                      <Link href={`/users/${rating.user?.username}`} style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                        {rating.user?.username ?? 'Anonymous'}
                      </Link>
                      {rating.user?.badge_tier && (
                        <div style={{ marginTop: '3px' }}>
                          <Badge tier={rating.user.badge_tier} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score + WBA */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1, color: getScoreColor(rating.overall_score) }}>
                      {rating.overall_score.toFixed(1)}
                    </div>
                    {rating.would_buy_again && (
                      <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '3px', fontWeight: 600 }}>
                        ✓ WBA
                      </div>
                    )}
                  </div>
                </div>

                {/* Dimension scores */}
                <div style={{
                  display: 'flex', gap: '8px', flexWrap: 'wrap',
                  padding: '12px 0',
                  borderTop: '1px solid var(--border-soft)',
                  borderBottom: rating.review_text || (rating.context_tags?.length > 0) ? '1px solid var(--border-soft)' : 'none',
                  marginBottom: rating.review_text || (rating.context_tags?.length > 0) ? '12px' : 0,
                }}>
                  {RATING_DIMENSIONS.map((dim) => {
                    const score = (rating.scores as Record<string, number>)?.[dim.key]
                    if (score === undefined) return null
                    return (
                      <div key={dim.key} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        backgroundColor: 'var(--bg-elevated)', borderRadius: '6px',
                        padding: '5px 10px',
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: getScoreColor(score) }}>{score}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{dim.label}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Review text */}
                {rating.review_text && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.65, margin: '0 0 12px' }}>
                    &ldquo;{rating.review_text}&rdquo;
                  </p>
                )}

                {/* Context tags */}
                {rating.context_tags && rating.context_tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {rating.context_tags.map((tag) => (
                      <span key={tag} className="tag">{tag.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                )}

                {/* Like */}
                <div style={{ paddingTop: '4px' }}>
                  <LikeButton
                    ratingId={rating.id}
                    initialCount={(rating as any).like_count ?? 0}
                    initialLiked={(rating as any).user_has_liked ?? false}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
