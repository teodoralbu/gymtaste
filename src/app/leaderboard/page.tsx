export const revalidate = 300

import Link from 'next/link'
import Image from 'next/image'
import { getLeaderboard, getTopReviewers } from '@/lib/queries'
import { getScoreColor, getBadgeTier, BADGE_TIERS } from '@/lib/constants'

const PODIUM_ACCENTS: Record<number, { color: string; label: string; glow: string }> = {
  1: { color: '#FFD700', label: 'Gold',   glow: 'rgba(255,215,0,0.15)' },
  2: { color: '#C0C0C0', label: 'Silver', glow: 'rgba(192,192,192,0.10)' },
  3: { color: '#CD7F32', label: 'Bronze', glow: 'rgba(205,127,50,0.12)' },
}

export default async function LeaderboardPage() {
  const [leaderboard, topReviewers] = await Promise.all([
    getLeaderboard(50),
    getTopReviewers(10),
  ])

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(16px, 5vw, 48px) 16px 96px' }}>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--accent)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}>
          GymTaste
        </div>
        <h1 style={{
          fontSize: 'clamp(26px, 5vw, 44px)',
          fontWeight: 900,
          margin: '0 0 10px',
          color: 'var(--text)',
          lineHeight: 1.1,
        }}>
          Leaderboards
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-muted)',
          margin: 0,
          lineHeight: 1.6,
        }}>
          Top members and highest-rated flavors.
        </p>
      </div>

      {/* ── Top Members by rating count ── */}
      {topReviewers.length > 0 && (
        <div style={{ marginBottom: '56px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Member Rankings
            </div>
            <h2 style={{
              fontSize: 'clamp(20px, 4vw, 28px)',
              fontWeight: 900,
              margin: '0 0 6px',
              color: 'var(--text)',
              lineHeight: 1.1,
            }}>
              Top Members
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Ranked by number of flavor ratings submitted.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {topReviewers.map((member, idx) => {
              const tierKey = getBadgeTier(member.rating_count ?? 0)
              const rank = BADGE_TIERS[tierKey]
              const position = idx + 1
              return (
                <Link
                  key={member.id}
                  href={`/users/${member.username}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    className="card-hover"
                    style={{
                      backgroundColor: position <= 3 ? 'var(--bg-elevated)' : 'var(--bg-card)',
                      border: position <= 3
                        ? `1px solid color-mix(in srgb, ${rank.color} 30%, var(--border))`
                        : '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: position <= 3 ? '16px 20px' : '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'box-shadow var(--transition-fast, 150ms ease), transform var(--transition-fast, 150ms ease)',
                    }}
                  >
                    {/* Position */}
                    <div style={{
                      width: '28px',
                      textAlign: 'center',
                      flexShrink: 0,
                      fontSize: position <= 3 ? '18px' : '12px',
                      fontWeight: 700,
                      color: position <= 3 ? rank.color : 'var(--text-faint)',
                    }}>
                      {position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `#${position}`}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 800, color: 'var(--accent)', overflow: 'hidden',
                    }}>
                      {member.avatar_url ? (
                        <Image src={member.avatar_url} alt={`${member.username}'s avatar`} width={36} height={36} style={{ objectFit: 'cover' }} />
                      ) : (
                        member.username?.[0]?.toUpperCase() ?? '?'
                      )}
                    </div>

                    {/* Name + rank */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.username}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: rank.color, marginTop: '2px' }}>
                        {rank.name}
                      </div>
                    </div>

                    {/* Rating count */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                        {(member.rating_count ?? 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ratings
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Flavor Leaderboard ── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--accent)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          Flavor Rankings
        </div>
        <h2 style={{
          fontSize: 'clamp(20px, 4vw, 28px)',
          fontWeight: 900,
          margin: '0 0 6px',
          color: 'var(--text)',
          lineHeight: 1.1,
        }}>
          Top Rated Flavors
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px' }}>
          Ranked by community score across all verified ratings.
        </p>
      </div>

      {leaderboard.length === 0 ? (
        /* Empty state */
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No ratings yet</p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 16 }}>Flavors will appear here once they receive ratings.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {leaderboard.map((item) => {
            const podium = PODIUM_ACCENTS[item.rank]
            const isPodium = item.rank <= 3

            return (
              <Link
                key={item.flavor_id}
                href={`/flavors/${item.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className="card-hover card-press"
                  style={{
                    backgroundColor: isPodium ? 'var(--bg-elevated)' : 'var(--bg-card)',
                    border: isPodium
                      ? `1px solid ${podium.color}40`
                      : '1px solid var(--border)',
                    borderRadius: isPodium ? 'var(--radius-lg)' : 'var(--radius-md)',
                    padding: isPodium ? '20px 24px' : '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: isPodium ? `0 0 24px ${podium.glow}` : 'none',
                    transition: 'box-shadow var(--transition-fast, 150ms ease), transform var(--transition-fast, 150ms ease)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Podium side accent bar */}
                  {isPodium && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      backgroundColor: podium.color,
                      borderRadius: '3px 0 0 3px',
                    }} />
                  )}

                  {/* Rank */}
                  <div style={{
                    width: isPodium ? '36px' : '30px',
                    textAlign: 'center',
                    flexShrink: 0,
                  }}>
                    {isPodium ? (
                      <div style={{
                        fontSize: isPodium ? '20px' : '16px',
                        fontWeight: 900,
                        color: podium.color,
                        lineHeight: 1,
                      }}>
                        {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                      </div>
                    ) : (
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: item.rank <= 10 ? 'var(--text-dim)' : 'var(--text-faint)',
                      }}>
                        #{item.rank}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-faint)',
                      marginBottom: '3px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 600,
                    }}>
                      {item.product.brands?.name ?? ''} · {item.product.name}
                    </div>
                    <div style={{
                      fontSize: isPodium ? '17px' : '15px',
                      fontWeight: isPodium ? 800 : 700,
                      color: 'var(--text)',
                      marginBottom: '6px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.name}
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {item.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag.id}
                            className="tag"
                            style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              backgroundColor: 'var(--bg-hover)',
                              color: 'var(--text-dim)',
                              border: '1px solid var(--border-soft)',
                              fontWeight: 500,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Score block */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: isPodium ? '32px' : '26px',
                      fontWeight: 900,
                      color: getScoreColor(item.avg_overall_score),
                      lineHeight: 1,
                      marginBottom: '4px',
                    }}>
                      {item.avg_overall_score.toFixed(1)}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-faint)',
                      marginBottom: item.would_buy_again_pct !== null ? '3px' : 0,
                    }}>
                      {item.rating_count} {item.rating_count === 1 ? 'rating' : 'ratings'}
                    </div>
                    {item.would_buy_again_pct !== null && (
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--green)',
                        fontWeight: 600,
                      }}>
                        {Math.round(item.would_buy_again_pct)}% WBA
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
