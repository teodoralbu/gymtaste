import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getFlavorBySlug } from '@/lib/queries'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ score?: string; first?: string }>
}

function getVerdict(score: number): { label: string; color: string } {
  if (score >= 8.5) return { label: 'ELITE TASTE', color: 'var(--accent)' }
  if (score >= 7.0) return { label: 'SOLID PICK', color: 'var(--green)' }
  if (score >= 5.0) return { label: 'DRINKABLE', color: 'var(--yellow, #f59e0b)' }
  return { label: 'SKIP IT', color: 'var(--red, #ef4444)' }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getFlavorBySlug(slug)
  if (!data) return {}
  return {
    title: `Rating Submitted — ${data.flavor.name} | GymTaste`,
  }
}

export default async function RateSuccessPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { score: scoreParam, first: firstParam } = await searchParams
  const isFirstRating = firstParam === '1'
  const data = await getFlavorBySlug(slug)

  if (!data) notFound()

  const { flavor } = data
  const product = flavor.product
  const brand = (product as any).brands

  const userScore = scoreParam ? parseFloat(scoreParam) : null
  const verdict = userScore !== null && !isNaN(userScore) ? getVerdict(userScore) : null

  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '0 auto',
        padding: 'clamp(40px, 10vw, 80px) 16px 96px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* Success icon */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'color-mix(in srgb, var(--green) 12%, transparent)',
          border: '2px solid color-mix(in srgb, var(--green) 35%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '28px',
          boxShadow: '0 0 32px color-mix(in srgb, var(--green) 15%, transparent)',
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--green)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {/* First-ever rating banner */}
      {isFirstRating && (
        <div style={{
          backgroundColor: 'var(--accent-dim)',
          border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 18px',
          marginBottom: '20px',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          You&apos;re in the database now
        </div>
      )}

      {/* Heading */}
      <h1
        style={{
          fontSize: 'clamp(26px, 5vw, 36px)',
          fontWeight: 900,
          margin: '0 0 10px',
          color: 'var(--text)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        {isFirstRating ? 'Welcome to GymTaste.' : 'Rating submitted!'}
      </h1>

      {/* Flavor context */}
      <div style={{ marginBottom: '32px' }}>
        <p
          style={{
            color: 'var(--text-dim)',
            fontSize: '15px',
            margin: '0 0 6px',
            lineHeight: 1.5,
          }}
        >
          {isFirstRating ? 'Your first verdict on' : 'Thanks for rating'}
        </p>
        <p
          style={{
            color: 'var(--text)',
            fontSize: '17px',
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {flavor.name}
        </p>
        {brand?.name && (
          <p
            style={{
              color: 'var(--text-dim)',
              fontSize: '13px',
              margin: '4px 0 0',
              fontWeight: 600,
            }}
          >
            {brand.name} · {product.name}
          </p>
        )}
      </div>

      {/* Verdict Drop — user's own score with bounce animation + verdict tag */}
      {userScore !== null && !isNaN(userScore) && verdict && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: `1.5px solid color-mix(in srgb, ${verdict.color} 30%, transparent)`,
            borderRadius: 'var(--radius-lg)',
            padding: '24px 32px',
            marginBottom: '16px',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            boxShadow: `0 0 32px color-mix(in srgb, ${verdict.color} 10%, transparent)`,
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Your Verdict
          </span>
          <span
            className="score-pop"
            style={{
              fontSize: '56px',
              fontWeight: 900,
              lineHeight: 1,
              color: verdict.color,
              letterSpacing: '-0.03em',
            }}
          >
            {userScore.toFixed(1)}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: verdict.color,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              backgroundColor: `color-mix(in srgb, ${verdict.color} 12%, transparent)`,
              padding: '4px 12px',
              borderRadius: '999px',
              border: `1px solid color-mix(in srgb, ${verdict.color} 25%, transparent)`,
            }}
          >
            {verdict.label}
          </span>
        </div>
      )}

      {/* Community score pill if available */}
      {flavor.avg_overall_score !== null && flavor.rating_count > 0 && (
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 20px',
            marginBottom: '32px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-faint)', fontWeight: 600 }}>
            Community
          </span>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 900,
              lineHeight: 1,
              color: 'var(--accent)',
              letterSpacing: '-0.02em',
            }}
          >
            {flavor.avg_overall_score.toFixed(1)}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            · {flavor.rating_count} {flavor.rating_count === 1 ? 'rating' : 'ratings'}
          </span>
        </div>
      )}

      {/* When no user score (fallback to original large community score) */}
      {userScore === null && flavor.avg_overall_score !== null && flavor.rating_count > 0 && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 28px',
            marginBottom: '36px',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Community Score
          </span>
          <span
            className="score-pop"
            style={{
              fontSize: '40px',
              fontWeight: 900,
              lineHeight: 1,
              color: 'var(--accent)',
              letterSpacing: '-0.03em',
            }}
          >
            {flavor.avg_overall_score.toFixed(1)}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            from {flavor.rating_count} {flavor.rating_count === 1 ? 'rating' : 'ratings'}
          </span>
        </div>
      )}

      {/* CTAs */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '100%',
          maxWidth: '320px',
        }}
      >
        <Link
          href={`/flavors/${slug}`}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '14px 24px',
            fontSize: '15px',
            fontWeight: 800,
            borderRadius: 'var(--radius-md)',
          }}
        >
          View Flavor
        </Link>

        <Link
          href="/rate"
          className="btn btn-secondary"
          style={{
            width: '100%',
            padding: '14px 24px',
            fontSize: '15px',
            fontWeight: 700,
            borderRadius: 'var(--radius-md)',
          }}
        >
          Rate Another
        </Link>

        <Link
          href="/browse"
          style={{
            color: 'var(--text-dim)',
            fontSize: '14px',
            fontWeight: 600,
            padding: '10px',
            textAlign: 'center',
            textDecoration: 'none',
          }}
        >
          Back to Browse
        </Link>
      </div>
    </div>
  )
}
