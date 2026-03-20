export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getScoreColor } from '@/lib/constants'
import type { Brand, Product, FlavorIdRow, RatingScoreRow } from '@/lib/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data: brand, error } = await supabase.from('brands').select('name').eq('slug', slug).single()
  if (error || !brand) return {}
  return {
    title: `${brand.name} Pre-Workout Flavors | GymTaste`,
    description: `All ${brand.name} products and flavor ratings on GymTaste. Find the best-tasting pre-workout from ${brand.name}.`,
  }
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('*')
    .eq('slug', slug)
    .single()
    .returns<Brand>()

  if (brandError || !brand) notFound()

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('brand_id', brand.id)
    .eq('is_approved', true)
    .order('name')
    .returns<Product[]>()

  if (productsError) { console.error('brand page: products query failed', productsError) }

  const productIds = (products ?? []).map((p) => p.id)

  // Flavors per product
  const flavorCountMap: Record<string, number> = {}
  const flavorToProduct: Record<string, string> = {}

  // Mutable stats map
  const productStats: Record<string, { _avg: number | null; _count: number }> = {}

  if (productIds.length > 0) {
    const { data: flavors } = await supabase
      .from('flavors')
      .select('id, product_id')
      .in('product_id', productIds)
      .returns<FlavorIdRow[]>()

    for (const f of flavors ?? []) {
      flavorCountMap[f.product_id] = (flavorCountMap[f.product_id] ?? 0) + 1
      flavorToProduct[f.id] = f.product_id
    }

    const flavorIds = (flavors ?? []).map((f) => f.id)
    if (flavorIds.length > 0) {
      const { data: ratings } = await supabase
        .from('ratings')
        .select('flavor_id, overall_score')
        .in('flavor_id', flavorIds)
        .returns<RatingScoreRow[]>()

      const scoresByProduct: Record<string, number[]> = {}
      for (const r of ratings ?? []) {
        const pid = flavorToProduct[r.flavor_id]
        if (!pid) continue
        if (!scoresByProduct[pid]) scoresByProduct[pid] = []
        scoresByProduct[pid].push(r.overall_score)
      }

      for (const p of products ?? []) {
        const scores = scoresByProduct[p.id] ?? []
        productStats[p.id] = {
          _avg: scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null,
          _count: scores.length,
        }
      }
    }
  }

  const totalFlavors = Object.values(flavorCountMap).reduce((a, b) => a + b, 0)

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(16px, 5vw, 48px) 16px 80px' }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '32px', display: 'flex', gap: '6px', alignItems: 'center' }}>
        <Link href="/" style={{ color: 'var(--text-dim)' }}>Home</Link>
        <span style={{ color: 'var(--text-faint)' }}>›</span>
        <Link href="/browse" style={{ color: 'var(--text-dim)' }}>Browse</Link>
        <span style={{ color: 'var(--text-faint)' }}>›</span>
        <span style={{ color: 'var(--text-muted)' }}>{brand.name}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, margin: '0 0 10px', color: 'var(--text)', letterSpacing: '-0.02em' }}>
          {brand.name}
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px', margin: 0 }}>
          {(products ?? []).length} products · {totalFlavors} flavors
        </p>
      </div>

      {/* Products */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {(products ?? []).map((product) => {
          const stats = productStats[product.id]
          return (
          <Link key={product.id} href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card card-hover" style={{
              padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>{product.name}</div>
                <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                  <span>{flavorCountMap[product.id] ?? 0} flavors</span>
                  {product.caffeine_mg != null && product.caffeine_mg > 0 && <span>{product.caffeine_mg}mg caffeine</span>}
                  {product.caffeine_mg === 0 && <span style={{ color: 'var(--green)', fontWeight: 600 }}>Stim-free</span>}
                  {product.price_per_serving && <span>${product.price_per_serving.toFixed(2)}/serving</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {stats?._avg != null ? (
                  <>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: getScoreColor(stats._avg), lineHeight: 1, letterSpacing: '-0.02em' }}>
                      {stats._avg.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px' }}>{stats._count} ratings</div>
                  </>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Unrated</div>
                )}
              </div>
              <div style={{ color: 'var(--border)', flexShrink: 0, fontSize: '18px', lineHeight: 1 }}>›</div>
            </div>
          </Link>
          )
        })}
      </div>
    </div>
  )
}
