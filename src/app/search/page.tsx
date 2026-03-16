export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getScoreColor } from '@/lib/constants'

interface Props {
  searchParams: Promise<{ q?: string }>
}

async function search(query: string) {
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const q = `%${query}%`

  const [{ data: flavors }, { data: products }, { data: brands }] = await Promise.all([
    db
      .from('flavors')
      .select('id, name, slug, products(id, name, slug, brands(name))')
      .ilike('name', q)
      .limit(10),
    db
      .from('products')
      .select('id, name, slug, brands(name)')
      .ilike('name', q)
      .eq('is_approved', true)
      .limit(8),
    db
      .from('brands')
      .select('id, name, slug')
      .ilike('name', q)
      .limit(5),
  ])

  // Get avg scores for matched flavors
  const flavorIds = ((flavors ?? []) as any[]).map((f) => f.id)
  const scoreMap: Record<string, { avg: number; count: number }> = {}

  if (flavorIds.length > 0) {
    const { data: ratings } = await db
      .from('ratings')
      .select('flavor_id, overall_score')
      .in('flavor_id', flavorIds)

    const grouped: Record<string, number[]> = {}
    for (const r of (ratings ?? []) as any[]) {
      if (!grouped[r.flavor_id]) grouped[r.flavor_id] = []
      grouped[r.flavor_id].push(r.overall_score)
    }
    for (const [fid, scores] of Object.entries(grouped)) {
      scoreMap[fid] = {
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        count: scores.length,
      }
    }
  }

  return {
    flavors: ((flavors ?? []) as any[]).map((f) => ({
      id: f.id as string,
      name: f.name as string,
      slug: f.slug as string,
      product: f.products as { name: string; slug: string; brands: { name: string } },
      avg_score: scoreMap[f.id]?.avg ?? null,
      rating_count: scoreMap[f.id]?.count ?? 0,
    })),
    products: ((products ?? []) as any[]).map((p) => ({
      id: p.id as string,
      name: p.name as string,
      slug: p.slug as string,
      brand: p.brands as { name: string },
    })),
    brands: ((brands ?? []) as any[]).map((b) => ({
      id: b.id as string,
      name: b.name as string,
      slug: b.slug as string,
    })),
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const results = query.length >= 2 ? await search(query) : null
  const total = results ? results.flavors.length + results.products.length + results.brands.length : 0

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(16px, 5vw, 48px) 16px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        {query ? (
          <>
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, margin: '0 0 8px', color: 'var(--text)' }}>
              Results for &ldquo;{query}&rdquo;
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px', margin: 0 }}>
              {total === 0 ? 'Nothing found' : `${total} result${total !== 1 ? 's' : ''}`}
            </p>
          </>
        ) : (
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, margin: 0, color: 'var(--text)' }}>
            Search
          </h1>
        )}
      </div>

      {/* No query */}
      {!query && (
        <p style={{ color: 'var(--text-dim)' }}>Type something in the search bar above.</p>
      )}

      {/* Query too short */}
      {query && query.length < 2 && (
        <p style={{ color: 'var(--text-dim)' }}>Type at least 2 characters.</p>
      )}

      {/* No results */}
      {results && total === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
          <p style={{ fontSize: '16px', margin: 0, color: 'var(--text-muted)' }}>No flavors, products or brands match &ldquo;{query}&rdquo;</p>
          <Link href="/browse" style={{ color: 'var(--accent)', fontSize: '14px', marginTop: '12px', display: 'inline-block' }}>
            Browse all products →
          </Link>
        </div>
      )}

      {results && total > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

          {/* Flavors */}
          {results.flavors.length > 0 && (
            <section>
              <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '12px' }}>
                Flavors ({results.flavors.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {results.flavors.map((flavor) => (
                  <Link key={flavor.id} href={`/flavors/${flavor.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card card-hover" style={{
                      padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: '14px',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{flavor.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px' }}>
                          {flavor.product?.brands?.name} · {flavor.product?.name}
                        </div>
                      </div>
                      {flavor.avg_score !== null ? (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: getScoreColor(flavor.avg_score), lineHeight: 1 }}>
                            {flavor.avg_score.toFixed(1)}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>{flavor.rating_count} ratings</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: 'var(--text-faint)', fontWeight: 600, flexShrink: 0 }}>Unrated</div>
                      )}
                      <div style={{ color: 'var(--border)', flexShrink: 0, fontSize: '18px', lineHeight: 1 }}>›</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Products */}
          {results.products.length > 0 && (
            <section>
              <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '12px' }}>
                Products ({results.products.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {results.products.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card card-hover" style={{
                      padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: '14px',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{product.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px' }}>{product.brand?.name}</div>
                      </div>
                      <div style={{ color: 'var(--border)', flexShrink: 0, fontSize: '18px', lineHeight: 1 }}>›</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Brands */}
          {results.brands.length > 0 && (
            <section>
              <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '12px' }}>
                Brands ({results.brands.length})
              </h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {results.brands.map((brand) => (
                  <Link key={brand.id} href={`/browse?brand=${brand.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="card card-hover" style={{
                      padding: '10px 18px',
                      fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)',
                    }}>
                      {brand.name}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  )
}
