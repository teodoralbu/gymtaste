export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getLeaderboard } from '@/lib/queries'
import { getScoreColor, BADGE_TIERS } from '@/lib/constants'

async function getStats() {
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [{ count: flavorCount }, { count: ratingCount }, { count: productCount }] = await Promise.all([
    db.from('flavors').select('*', { count: 'exact', head: true }),
    db.from('ratings').select('*', { count: 'exact', head: true }),
    db.from('products').select('*', { count: 'exact', head: true }).eq('is_approved', true),
  ])

  return {
    flavors: flavorCount ?? 0,
    ratings: ratingCount ?? 0,
    products: productCount ?? 0,
  }
}

const tiers = Object.entries(BADGE_TIERS).map(([, v]) => ({
  name: v.name,
  req: v.max === Infinity ? `${v.min}+` : `${v.min}–${v.max}`,
  color: v.color,
}))

const categories = [
  { icon: '⚡', name: 'Pre-Workout', status: 'Live', active: true },
  { icon: '💪', name: 'Protein Powder', status: 'Coming soon', active: false },
  { icon: '🔋', name: 'Energy Drinks', status: 'Coming soon', active: false },
]

export default async function Home() {
  const [stats, leaderboard] = await Promise.all([getStats(), getLeaderboard(5)])

  const statItems = [
    { value: `${stats.flavors}+`, label: 'Flavors rated' },
    { value: '10', label: 'Brands covered' },
    { value: `${stats.products}`, label: 'Products listed' },
    { value: `${stats.ratings}`, label: 'Community ratings' },
  ]

  return (
    <div>

      {/* ── Hero ── */}
      <section style={{
        textAlign: 'center',
        padding: 'clamp(32px, 8vw, 120px) 24px clamp(24px, 5vw, 80px)',
      }}>

        {/* Logo mark */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '36px',
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '16px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
          }}>
            <svg width="40" height="40" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="40,10 74,70 6,70" fill="var(--text)" />
              <polygon points="42,31 30,51 40,51 35,66 52,46 42,46" fill="var(--bg-elevated)" />
            </svg>
          </div>
        </div>

        {/* Eyebrow */}
        <div style={{
          display: 'inline-block',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--accent)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: '20px',
          padding: '4px 12px',
          borderRadius: '999px',
          backgroundColor: 'var(--accent-dim)',
          border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)',
        }}>
          Rated by real lifters
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(38px, 7vw, 76px)',
          fontWeight: 900,
          lineHeight: 1.0,
          letterSpacing: '-0.03em',
          margin: '0 auto 20px',
          maxWidth: '820px',
          color: 'var(--text)',
        }}>
          Rate it before you{' '}
          <span style={{
            color: 'var(--accent)',
            display: 'inline-block',
          }}>
            waste it.
          </span>
        </h1>

        {/* Subtext */}
        <p style={{
          fontSize: 'clamp(15px, 2.5vw, 18px)',
          color: 'var(--text-muted)',
          maxWidth: '480px',
          margin: '0 auto 48px',
          lineHeight: 1.7,
        }}>
          GYMTASTE is where lifters have a word. Real ratings from real people — on everything in the gym world.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <Link href="/browse" className="btn btn-primary" style={{
            padding: '13px 28px',
            fontSize: '15px',
            fontWeight: 700,
            textDecoration: 'none',
            borderRadius: 'var(--radius-md)',
          }}>
            Browse products
          </Link>
          <Link href="/leaderboard" className="btn btn-secondary" style={{
            padding: '13px 28px',
            fontSize: '15px',
            fontWeight: 600,
            textDecoration: 'none',
            borderRadius: 'var(--radius-md)',
          }}>
            Top rated
          </Link>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '40px 24px',
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(32px, 8vw, 80px)',
          flexWrap: 'wrap',
        }}>
          {statItems.map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 'clamp(26px, 4vw, 36px)',
                fontWeight: 900,
                color: 'var(--accent)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-dim)',
                marginTop: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 500,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Top flavors ── */}
      <section style={{ maxWidth: '860px', margin: '0 auto', padding: '72px 24px' }}>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '28px',
          gap: '12px',
        }}>
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 800,
              margin: '0 0 4px',
              letterSpacing: '-0.01em',
              color: 'var(--text)',
            }}>
              Top Rated Flavors
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dim)' }}>
              Ranked by community score
            </p>
          </div>
          <Link href="/leaderboard" style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--accent)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            View all →
          </Link>
        </div>

        {leaderboard.length === 0 ? (
          <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-dim)', margin: 0 }}>
              No ratings yet —{' '}
              <Link href="/browse" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                browse products
              </Link>{' '}
              and be the first.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaderboard.map((item) => (
              <Link
                key={item.flavor_id}
                href={`/flavors/${item.slug}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div className="card card-hover" style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}>

                  {/* Rank */}
                  <div style={{
                    width: '32px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: 800,
                    color: item.rank <= 3 ? 'var(--accent)' : 'var(--text-faint)',
                    flexShrink: 0,
                    letterSpacing: '-0.01em',
                  }}>
                    #{item.rank}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-dim)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {(item.product as any).brands?.name} &middot; {item.product.name}
                    </div>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.name}
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag.id} className="tag" style={{ fontSize: '11px' }}>
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: '26px',
                      fontWeight: 900,
                      color: getScoreColor(item.avg_overall_score),
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                    }}>
                      {item.avg_overall_score.toFixed(1)}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-dim)',
                      marginTop: '4px',
                      fontWeight: 500,
                    }}>
                      {item.rating_count} ratings
                    </div>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Badge tiers ── */}
      <section style={{
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '72px 24px',
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 800,
            marginBottom: '8px',
            letterSpacing: '-0.01em',
            color: 'var(--text)',
          }}>
            Earn your rank
          </h2>
          <p style={{
            color: 'var(--text-muted)',
            marginBottom: '40px',
            fontSize: '14px',
            lineHeight: 1.6,
          }}>
            Rate more flavors to climb the tiers.
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}>
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className="card"
                style={{
                  padding: '18px 22px',
                  minWidth: '110px',
                  textAlign: 'center',
                  borderColor: `color-mix(in srgb, ${tier.color} 30%, var(--border))`,
                }}
              >
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: tier.color,
                  margin: '0 auto 10px',
                  boxShadow: `0 0 8px ${tier.color}66`,
                }} />
                <div style={{
                  fontWeight: 700,
                  fontSize: '13px',
                  marginBottom: '4px',
                  color: 'var(--text)',
                }}>
                  {tier.name}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-dim)',
                  fontWeight: 500,
                }}>
                  {tier.req} ratings
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '72px 24px 96px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 800,
          marginBottom: '8px',
          letterSpacing: '-0.01em',
          color: 'var(--text)',
        }}>
          More categories on the way
        </h2>
        <p style={{
          color: 'var(--text-muted)',
          marginBottom: '40px',
          fontSize: '14px',
          lineHeight: 1.6,
        }}>
          We&apos;re starting with pre-workouts — protein powder and energy drinks are next.
        </p>
        <div style={{
          display: 'flex',
          gap: '14px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {categories.map((cat) => (
            <div
              key={cat.name}
              className={cat.active ? 'card card-hover' : 'card'}
              style={{
                padding: '28px 32px',
                minWidth: '150px',
                opacity: cat.active ? 1 : 0.45,
                borderColor: cat.active
                  ? 'color-mix(in srgb, var(--accent) 35%, var(--border))'
                  : 'var(--border)',
                cursor: cat.active ? 'default' : 'default',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px', lineHeight: 1 }}>
                {cat.icon}
              </div>
              <div style={{
                fontWeight: 700,
                fontSize: '14px',
                marginBottom: '6px',
                color: 'var(--text)',
              }}>
                {cat.name}
              </div>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: cat.active ? 'var(--accent)' : 'var(--text-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {cat.status}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
