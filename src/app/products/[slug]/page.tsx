export const revalidate = 300

import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getProductBySlug } from '@/lib/queries'
import { getScoreColor } from '@/lib/constants'
import { NutritionSwitcher } from './NutritionSwitcher'
import { LabelModal } from './LabelModal'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getProductBySlug(slug)
  if (!data) return {}
  const { product, flavors } = data
  const brand = (product as any).brands
  return {
    title: `${product.name} — ${brand?.name ?? ''} | FitFlavor`,
    description: `${flavors.length} flavor${flavors.length !== 1 ? 's' : ''} of ${product.name} by ${brand?.name ?? 'brand'}. Read community ratings and find the best flavor.`,
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const data = await getProductBySlug(slug)

  if (!data) notFound()

  const { product, flavors } = data
  const brand = (product as any).brands

  const specs = [
    { label: 'Caffeine', value: product.caffeine_mg ? `${product.caffeine_mg}mg` : null },
    { label: 'Citrulline', value: product.citrulline_g ? `${product.citrulline_g}g` : null },
    { label: 'Beta-Alanine', value: product.beta_alanine_g ? `${product.beta_alanine_g}g` : null },
    { label: 'Price/serving', value: product.price_per_serving ? `$${product.price_per_serving.toFixed(2)}` : null },
    { label: 'Servings', value: product.servings_per_container ? `${product.servings_per_container}` : null },
  ].filter((s) => s.value !== null)

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(16px, 4vw, 40px) 16px 80px' }}>

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          marginBottom: '32px',
          fontSize: '13px',
          color: 'var(--text-dim)',
        }}
      >
        <Link href="/" className="footer-link">Home</Link>
        <span style={{ color: 'var(--border)', fontSize: '12px' }}>›</span>
        <Link href={`/brands/${brand?.slug ?? ''}`} className="footer-link">
          {brand?.name ?? 'Brand'}
        </Link>
        <span style={{ color: 'var(--border)', fontSize: '12px' }}>›</span>
        <span style={{ color: 'var(--text-faint)' }}>{product.name}</span>
      </nav>

      {/* Hero image */}
      {product.image_url && (
        <div
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            maxHeight: '420px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url}
            alt={`${product.name} by ${brand?.name ?? 'Unknown'}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </div>
      )}

      {/* Brand + Product name */}
      <div style={{ marginBottom: '36px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          {brand?.name}
        </div>
        <h1
          style={{
            fontSize: 'clamp(26px, 5vw, 44px)',
            fontWeight: 900,
            margin: '0 0 12px',
            color: 'var(--text)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          {product.name}
        </h1>
        {product.description && (
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '15px',
              lineHeight: 1.65,
              maxWidth: '600px',
              margin: 0,
            }}
          >
            {product.description}
          </p>
        )}
      </div>

      {/* Specs */}
      {specs.length > 0 && (
        <div
          className="card"
          style={{
            display: 'flex',
            gap: '0',
            flexWrap: 'wrap',
            marginBottom: '40px',
            padding: '0',
            overflow: 'hidden',
          }}
        >
          {specs.map((spec, i) => (
            <div
              key={spec.label}
              style={{
                flex: '1 1 80px',
                textAlign: 'center',
                padding: '18px 20px',
                borderRight: i < specs.length - 1 ? '1px solid var(--border-soft)' : 'none',
              }}
            >
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: 'var(--text)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  marginBottom: '5px',
                }}
              >
                {spec.value}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text-faint)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  fontWeight: 600,
                }}
              >
                {spec.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nutrition */}
      <div style={{ marginBottom: '24px' }}>
        <NutritionSwitcher
          calories={product.calories}
          proteinG={product.protein_g}
          carbsG={product.carbs_g}
          fatG={product.fat_g}
          sugarG={product.sugar_g}
          sodiumMg={product.sodium_mg}
          scoopWeightG={product.scoop_weight_g}
          servingWeightG={product.serving_weight_g}
        />
      </div>

      {/* Label */}
      <div style={{ marginBottom: '40px' }}>
        <LabelModal
          ingredients={product.ingredients}
          sweeteners={product.sweeteners}
          chemicals={product.chemicals}
        />
      </div>

      {/* Flavors */}
      <div>
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 800,
            marginBottom: '14px',
            color: 'var(--text)',
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
          }}
        >
          Flavors
          <span
            style={{
              color: 'var(--text-faint)',
              fontWeight: 500,
              fontSize: '13px',
            }}
          >
            {flavors.length}
          </span>
        </h2>

        {flavors.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No flavors listed yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {flavors.map((flavor) => (
              <Link
                key={flavor.id}
                href={`/flavors/${flavor.slug}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div
                  className="card card-hover card-press"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  {/* Flavor info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: 'var(--text)',
                        marginBottom: flavor.tags && flavor.tags.length > 0 ? '8px' : '0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {flavor.name}
                    </div>
                    {flavor.tags && flavor.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {flavor.tags.map((tag) => (
                          <span key={tag.id} className="tag">
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {flavor.avg_overall_score !== null ? (
                      <>
                        <div
                          style={{
                            fontSize: '26px',
                            fontWeight: 900,
                            color: getScoreColor(flavor.avg_overall_score),
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {flavor.avg_overall_score.toFixed(1)}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-faint)',
                            marginTop: '3px',
                            fontWeight: 500,
                          }}
                        >
                          {flavor.rating_count} {flavor.rating_count === 1 ? 'rating' : 'ratings'}
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-faint)',
                          fontWeight: 600,
                        }}
                      >
                        No ratings
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div
                    style={{
                      color: 'var(--border)',
                      flexShrink: 0,
                      fontSize: '18px',
                      lineHeight: 1,
                    }}
                  >
                    ›
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
