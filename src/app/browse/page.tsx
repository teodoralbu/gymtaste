export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getScoreColor } from '@/lib/constants'

async function getProductsWithStats() {
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: products } = await db
    .from('products')
    .select('*, brands(*), categories(*), image_url')
    .eq('is_approved', true)
    .order('name')

  if (!products || products.length === 0) return []

  const productIds = (products as any[]).map((p) => p.id)
  const flavorCountMap: Record<string, number> = {}
  const flavorToProduct: Record<string, string> = {}

  const { data: flavors } = await db
    .from('flavors').select('id, product_id').in('product_id', productIds)

  for (const f of (flavors ?? []) as any[]) {
    flavorCountMap[f.product_id] = (flavorCountMap[f.product_id] ?? 0) + 1
    flavorToProduct[f.id] = f.product_id
  }

  const flavorIds = ((flavors ?? []) as any[]).map((f) => f.id)
  let ratingsByProduct: Record<string, number[]> = {}

  if (flavorIds.length > 0) {
    const { data: ratings } = await db
      .from('ratings').select('flavor_id, overall_score').in('flavor_id', flavorIds)
    for (const r of (ratings ?? []) as any[]) {
      const pid = flavorToProduct[r.flavor_id]
      if (!pid) continue
      if (!ratingsByProduct[pid]) ratingsByProduct[pid] = []
      ratingsByProduct[pid].push(r.overall_score)
    }
  }

  return (products as any[]).map((p) => {
    const scores = ratingsByProduct[p.id] ?? []
    const avg = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null
    return {
      id: p.id as string,
      name: p.name as string,
      slug: p.slug as string,
      image_url: p.image_url as string | null,
      brand: p.brands as { name: string; slug: string },
      caffeine_mg: p.caffeine_mg as number | null,
      flavor_count: flavorCountMap[p.id] ?? 0,
      avg_score: avg,
      rating_count: scores.length,
    }
  })
}

export default async function BrowsePage() {
  const products = await getProductsWithStats()

  const byBrand: Record<string, typeof products> = {}
  for (const p of products) {
    const key = p.brand?.name ?? 'Other'
    if (!byBrand[key]) byBrand[key] = []
    byBrand[key].push(p)
  }
  const brands = Object.keys(byBrand).sort()

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
          ⚡ Pre-Workout
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, margin: '0 0 10px', color: 'var(--text)' }}>
          Browse Products
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '15px', margin: 0 }}>
          {products.length} products · {products.reduce((s, p) => s + p.flavor_count, 0)} flavors
        </p>
      </div>

      {brands.map((brandName, bi) => (
        <div key={brandName} style={{ marginBottom: '56px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '16px', paddingBottom: '12px',
            borderBottom: '1px solid var(--border-soft)',
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', margin: 0, letterSpacing: '0.05em' }}>
              {brandName}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)', fontWeight: 600 }}>
              {byBrand[brandName].length} products
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
          }}>
            {byBrand[brandName].map((product, pi) => (
              <Link key={product.id} href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  className="card card-hover card-press"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    animationDelay: `${(bi * 5 + pi) * 40}ms`,
                  }}
                >
                  {/* Image + Score row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    {/* Image */}
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '10px', flexShrink: 0,
                      backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url} alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                        />
                      ) : (
                        <span style={{ fontSize: '26px' }}>⚡</span>
                      )}
                    </div>

                    {/* Name + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', marginBottom: '5px', lineHeight: 1.3 }}>
                        {product.name}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                          {product.flavor_count} flavor{product.flavor_count !== 1 ? 's' : ''}
                        </span>
                        {product.caffeine_mg != null && product.caffeine_mg > 0 && (
                          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{product.caffeine_mg}mg</span>
                        )}
                        {product.caffeine_mg === 0 && (
                          <span style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600 }}>Stim-free</span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {product.avg_score !== null ? (
                        <>
                          <div style={{ fontSize: '26px', fontWeight: 900, lineHeight: 1, color: getScoreColor(product.avg_score) }}>
                            {product.avg_score.toFixed(1)}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px' }}>
                            {product.rating_count}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600, paddingTop: '6px' }}>
                          Unrated
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: '12px', borderTop: '1px solid var(--border-soft)',
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {product.rating_count > 0 ? `${product.rating_count} rating${product.rating_count !== 1 ? 's' : ''}` : 'No ratings yet'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
                      View flavors →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
