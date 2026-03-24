export const revalidate = 300

import Link from 'next/link'
import Image from 'next/image'
import { getLeaderboard, getTopReviewers, getTopRatedThisMonth, type LeaderboardTab } from '@/lib/queries'
import { getScoreColor, getBadgeTier, BADGE_TIERS } from '@/lib/constants'

const PODIUM_ACCENTS: Record<number, { color: string; label: string; glow: string }> = {
  1: { color: '#FFD700', label: 'Gold',   glow: 'rgba(255,215,0,0.15)' },
  2: { color: '#C0C0C0', label: 'Silver', glow: 'rgba(192,192,192,0.10)' },
  3: { color: '#CD7F32', label: 'Bronze', glow: 'rgba(205,127,50,0.12)' },
}

const TABS: { key: LeaderboardTab; label: string }[] = [
  { key: 'overall',      label: 'Overall' },
  { key: 'flavor',       label: 'Flavor' },
  { key: 'pump',         label: 'Pump' },
  { key: 'energy_focus', label: 'Energy' },
  { key: 'value',        label: 'Value' },
]

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: tabParam } = await searchParams
  const activeTab: LeaderboardTab = (TABS.find(t => t.key === tabParam)?.key) ?? 'overall'

  const [leaderboard, topReviewers, topThisMonth] = await Promise.all([
    getLeaderboard(50, activeTab),
    getTopReviewers(10),
    getTopRatedThisMonth(10),
  ])

  const featuredItem = topThisMonth[0] ?? null
  const carouselItems = topThisMonth.slice(0, 8)

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 0 96px' }}>

      {/* ── Hero CTA card ── */}
      <div style={{
        borderRadius: '0',
        backgroundColor: 'var(--bg-card)',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
        textAlign: 'center',
        marginBottom: '0',
      }}>
        <Image
          src="/hero-placeholder.jpg"
          alt="Pre-workout supplement"
          width={800}
          height={400}
          style={{ width: '100%', height: 'auto', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
          priority
        />
        <div style={{ padding: '24px 16px 20px' }}>
          <h1 style={{
            fontSize: 'clamp(24px, 7vw, 34px)',
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            margin: '0 0 8px',
            color: 'var(--text)',
          }}>
            Rate it before you{' '}
            <span style={{ color: 'var(--accent)' }}>waste it.</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-dim)', margin: '0 0 18px', lineHeight: 1.6 }}>
            Discover what the fitness community actually thinks. Real experiences, real ratings.
          </p>
          <Link
            href="/rate"
            style={{
              display: 'block', width: '100%', textAlign: 'center',
              padding: '13px 20px', boxSizing: 'border-box',
              backgroundColor: 'var(--accent)', color: '#000',
              borderRadius: 'var(--radius-md)', fontSize: '15px', fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Rate a Supplement →
          </Link>
        </div>
      </div>

      {/* ── Category pills ── */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '14px 16px 12px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 14px', borderRadius: '999px',
          backgroundColor: 'var(--accent)', color: '#000',
          fontSize: '13px', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          <span>⚡</span><span>Pre-Workout</span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#000', opacity: 0.4 }} />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 14px', borderRadius: '999px',
          backgroundColor: 'var(--bg-elevated)', color: 'var(--text-faint)',
          fontSize: '13px', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap',
          border: '1px solid var(--border)',
        }}>
          <span>💪</span><span>Protein</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 14px', borderRadius: '999px',
          backgroundColor: 'var(--bg-elevated)', color: 'var(--text-faint)',
          fontSize: '13px', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap',
          border: '1px solid var(--border)',
        }}>
          <span>🔋</span><span>Energy</span>
        </div>
      </div>

      {/* ── Featured #1 This Month ── */}
      {featuredItem && (
        <div style={{ padding: '20px 16px 0' }}>
          <Link href={`/flavors/${featuredItem.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              position: 'relative',
              minHeight: '190px',
              backgroundColor: 'color-mix(in srgb, var(--accent) 15%, var(--bg-elevated))',
              border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--border))',
            }}>
              {(featuredItem.flavor_image_url ?? featuredItem.product.image_url) ? (
                <>
                  <Image
                    src={(featuredItem.flavor_image_url ?? featuredItem.product.image_url)!}
                    alt={featuredItem.name}
                    width={800}
                    height={400}
                    style={{ width: '100%', height: '190px', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                  }} />
                  <div style={{
                    position: 'absolute', top: '14px', left: '14px',
                    padding: '4px 10px', borderRadius: '999px',
                    backgroundColor: 'var(--accent)', color: '#000',
                    fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    🥇 #1 This Month
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                      <div style={{ fontSize: '48px', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>
                        {featuredItem.avg_overall_score.toFixed(1)}
                      </div>
                      <div style={{ paddingBottom: '6px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '3px' }}>
                          {featuredItem.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                          {featuredItem.product.brands?.name} · {featuredItem.rating_count} {featuredItem.rating_count === 1 ? 'rating' : 'ratings'}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '18px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '999px',
                    backgroundColor: 'var(--accent)', color: '#000',
                    fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em',
                    textTransform: 'uppercase', marginBottom: '20px',
                  }}>
                    🥇 #1 This Month
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: 'color-mix(in srgb, var(--accent) 20%, var(--bg-card))',
                      border: '2px solid color-mix(in srgb, var(--accent) 40%, transparent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.03em' }}>
                        {featuredItem.avg_overall_score.toFixed(1)}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>
                        {featuredItem.product.brands?.name}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text)', lineHeight: 1.2, marginBottom: '5px' }}>
                        {featuredItem.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        {featuredItem.product.name} · {featuredItem.rating_count} {featuredItem.rating_count === 1 ? 'rating' : 'ratings'}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    marginTop: '20px', padding: '11px 0', borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent)', color: '#000',
                    fontSize: '14px', fontWeight: 700, textAlign: 'center',
                  }}>
                    View Product →
                  </div>
                </div>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* ── Top Rated This Month carousel ── */}
      {carouselItems.length > 0 && (
        <div style={{ marginTop: '24px', marginBottom: '8px' }}>
          <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)' }}>Top Rated This Month</span>
            <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: 600 }}>Pre-Workout</span>
          </div>
          <div style={{
            display: 'flex', gap: '10px',
            overflowX: 'auto', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '4px',
            scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          }}>
            {carouselItems.map((item) => {
              const imgSrc = item.flavor_image_url ?? item.product.image_url
              return (
                <Link key={item.flavor_id} href={`/flavors/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0 }}>
                  <div style={{
                    width: '120px', borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)',
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{ position: 'relative', width: '120px', height: '140px', flexShrink: 0 }}>
                      {imgSrc ? (
                        <Image src={imgSrc} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="120px" />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          background: 'linear-gradient(160deg, color-mix(in srgb, var(--accent) 30%, var(--bg-elevated)) 0%, color-mix(in srgb, var(--accent) 10%, var(--bg-elevated)) 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)', opacity: 0.5, letterSpacing: '-0.03em' }}>
                            {(item.product.brands?.name ?? item.name)[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {item.rank <= 3 && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '14px', lineHeight: 1 }}>
                          {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '10px 10px 12px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: getScoreColor(item.avg_overall_score), lineHeight: 1, marginBottom: '5px', letterSpacing: '-0.02em' }}>
                        {item.avg_overall_score.toFixed(1)}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '4px' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {item.product.brands?.name}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Divider ── */}
      <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '28px 0 0' }} />

      {/* ── Top Members ── */}
      <div style={{ padding: '0 16px' }}>
        {topReviewers.length > 0 && (
          <div style={{ marginTop: '32px', marginBottom: '40px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Member Rankings
              </div>
              <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, margin: '0 0 6px', color: 'var(--text)', lineHeight: 1.1 }}>
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
                  <Link key={member.id} href={`/users/${member.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div
                      className="card-hover"
                      style={{
                        backgroundColor: position <= 3 ? 'var(--bg-elevated)' : 'var(--bg-card)',
                        border: position <= 3
                          ? `1px solid color-mix(in srgb, ${rank.color} 30%, var(--border))`
                          : '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: position <= 3 ? '16px 20px' : '12px 16px',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        transition: 'box-shadow var(--transition-fast, 150ms ease), transform var(--transition-fast, 150ms ease)',
                      }}
                    >
                      <div style={{ width: '28px', textAlign: 'center', flexShrink: 0, fontSize: position <= 3 ? '18px' : '12px', fontWeight: 700, color: position <= 3 ? rank.color : 'var(--text-faint)' }}>
                        {position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `#${position}`}
                      </div>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: 'var(--accent)', overflow: 'hidden' }}>
                        {member.avatar_url ? (
                          <Image src={member.avatar_url} alt={`${member.username}'s avatar`} width={36} height={36} style={{ objectFit: 'cover' }} />
                        ) : (
                          member.username?.[0]?.toUpperCase() ?? '?'
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.username}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: rank.color, marginTop: '2px' }}>{rank.name}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                          {(member.rating_count ?? 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ratings</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Flavor Leaderboard ── */}
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, margin: '0 0 16px', color: 'var(--text)', lineHeight: 1.1 }}>
            Top Rated Flavors
          </h2>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '20px', scrollbarWidth: 'none' }}>
            {TABS.map(({ key, label }) => {
              const isActive = key === activeTab
              return (
                <Link
                  key={key}
                  href={key === 'overall' ? '/leaderboard' : `/leaderboard?tab=${key}`}
                  style={{
                    flexShrink: 0, padding: '7px 16px', borderRadius: '999px',
                    fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                    backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: isActive ? '#000' : 'var(--text-dim)',
                    border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                    transition: 'all 0.15s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>

        {leaderboard.length === 0 ? (
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
                <Link key={item.flavor_id} href={`/flavors/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div
                    className="card-hover card-press"
                    style={{
                      backgroundColor: isPodium ? 'var(--bg-elevated)' : 'var(--bg-card)',
                      border: isPodium ? `1px solid ${podium.color}40` : '1px solid var(--border)',
                      borderRadius: isPodium ? 'var(--radius-lg)' : 'var(--radius-md)',
                      padding: isPodium ? '20px 24px' : '14px 20px',
                      display: 'flex', alignItems: 'center', gap: '16px',
                      boxShadow: isPodium ? `0 0 24px ${podium.glow}` : 'none',
                      transition: 'box-shadow var(--transition-fast, 150ms ease), transform var(--transition-fast, 150ms ease)',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {isPodium && (
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: podium.color, borderRadius: '3px 0 0 3px' }} />
                    )}
                    <div style={{ width: isPodium ? '36px' : '30px', textAlign: 'center', flexShrink: 0 }}>
                      {isPodium ? (
                        <div style={{ fontSize: '20px', fontWeight: 900, color: podium.color, lineHeight: 1 }}>
                          {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', fontWeight: 700, color: item.rank <= 10 ? 'var(--text-dim)' : 'var(--text-faint)' }}>
                          #{item.rank}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                        {item.product.brands?.name ?? ''} · {item.product.name}
                      </div>
                      <div style={{ fontSize: isPodium ? '17px' : '15px', fontWeight: isPodium ? 800 : 700, color: 'var(--text)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {item.tags.slice(0, 4).map((tag) => (
                            <span key={tag.id} className="tag" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-dim)', border: '1px solid var(--border-soft)', fontWeight: 500 }}>
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: isPodium ? '32px' : '26px', fontWeight: 900, color: getScoreColor(item.avg_overall_score), lineHeight: 1, marginBottom: '4px' }}>
                        {item.avg_overall_score.toFixed(1)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginBottom: item.would_buy_again_pct !== null ? '3px' : 0 }}>
                        {item.rating_count} {item.rating_count === 1 ? 'rating' : 'ratings'}
                      </div>
                      {item.would_buy_again_pct !== null && (
                        <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>
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
    </div>
  )
}
