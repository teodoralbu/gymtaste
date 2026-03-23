export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getTopRatedThisMonth, getLeaderboard, getUnifiedFeed, getFollowingUnifiedFeed } from '@/lib/queries'
import { FeedCard } from '@/components/feed/FeedCard'
import { FeedList } from '@/components/feed/FeedList'
import { getScoreColor, BADGE_TIERS } from '@/lib/constants'

async function getStats() {
  const supabase = await createServerSupabaseClient()
  const [{ count: flavorCount }, { count: ratingCount }, { count: productCount }, { count: brandCount }] = await Promise.all([
    supabase.from('flavors').select('*', { count: 'exact', head: true }),
    supabase.from('ratings').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    supabase.from('brands').select('*', { count: 'exact', head: true }),
  ])
  return {
    flavors: flavorCount ?? 0,
    ratings: ratingCount ?? 0,
    products: productCount ?? 0,
    brands: brandCount ?? 0,
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

// Category accent colors — pre-workout = app accent, others defined for future
const CATEGORY_COLORS: Record<string, string> = {
  'pre-workout': 'var(--accent)',
  'protein': '#3B82F6',
  'energy': '#EAB308',
}

export default async function Home({ searchParams }: { searchParams: Promise<{ feed?: string }> }) {
  const { feed } = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isFollowingTab = feed === 'following' && !!user

  const [stats, topThisMonth, leaderboard, globalFeed, followingFeed] = await Promise.all([
    getStats(),
    getTopRatedThisMonth(10),
    getLeaderboard(5),
    getUnifiedFeed(20, user?.id),
    isFollowingTab && user ? getFollowingUnifiedFeed(user.id, 20) : Promise.resolve([]),
  ])

  const feedItems = isFollowingTab ? followingFeed : globalFeed
  const initialCursor = feedItems.length === 20 ? feedItems[feedItems.length - 1].created_at : null
  const featuredItem = topThisMonth[0] ?? null
  const carouselItems = topThisMonth.slice(0, 8)

  const statItems = [
    { value: `${stats.flavors}+`, label: 'Flavors rated' },
    { value: `${stats.brands}`, label: 'Brands covered' },
    { value: `${stats.products}`, label: 'Products listed' },
    { value: `${stats.ratings}`, label: 'Community ratings' },
  ]

  return (
    <div>

      {/* ── Mobile layout ── */}
      <div className="sm:hidden" style={{ paddingBottom: '96px' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 16px 12px',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backgroundColor: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '21px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em' }}>
            FitFlavor
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/search" style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent' }} aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Link>
            <Link href="/notifications" style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent' }} aria-label="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
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
        }}>
          {/* Pre-Workout — active */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '999px',
            backgroundColor: 'var(--accent)',
            color: '#000',
            fontSize: '13px',
            fontWeight: 700,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            <span>⚡</span>
            <span>Pre-Workout</span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#000', opacity: 0.4 }} />
          </div>
          {/* Protein — coming soon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '999px',
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-faint)',
            fontSize: '13px',
            fontWeight: 600,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            border: '1px solid var(--border)',
          }}>
            <span>💪</span>
            <span>Protein</span>
          </div>
          {/* Energy — coming soon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '999px',
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-faint)',
            fontSize: '13px',
            fontWeight: 600,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            border: '1px solid var(--border)',
          }}>
            <span>🔋</span>
            <span>Energy</span>
          </div>
        </div>

        {/* ── Featured #1 This Month ── */}
        {featuredItem && (
          <div style={{ padding: '0 16px', marginBottom: '24px' }}>
            <Link href={`/flavors/${featuredItem.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                position: 'relative',
                minHeight: '200px',
                backgroundColor: 'color-mix(in srgb, var(--accent) 15%, var(--bg-elevated))',
                border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--border))',
              }}>
                {/* Product image or gradient background */}
                {(featuredItem.flavor_image_url ?? featuredItem.product.image_url) ? (
                  <>
                    <Image
                      src={(featuredItem.flavor_image_url ?? featuredItem.product.image_url)!}
                      alt={featuredItem.name}
                      width={800}
                      height={400}
                      style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                      priority
                    />
                    {/* Dark gradient overlay so text is readable */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                    }} />
                    {/* Badge #1 — top left */}
                    <div style={{
                      position: 'absolute',
                      top: '14px',
                      left: '14px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--accent)',
                      color: '#000',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}>
                      🥇 #1 This Month
                    </div>
                    {/* Score + info — bottom left */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      padding: '16px 18px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                        <div style={{
                          fontSize: '48px',
                          fontWeight: 900,
                          color: '#fff',
                          lineHeight: 1,
                          letterSpacing: '-0.03em',
                        }}>
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
                  /* No image — gradient layout */
                  <div style={{ padding: '18px' }}>
                    {/* Badge */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--accent)',
                      color: '#000',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      marginBottom: '20px',
                    }}>
                      🥇 #1 This Month
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {/* Big score circle */}
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: 'color-mix(in srgb, var(--accent) 20%, var(--bg-card))',
                        border: '2px solid color-mix(in srgb, var(--accent) 40%, transparent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{
                          fontSize: '26px',
                          fontWeight: 900,
                          color: 'var(--accent)',
                          letterSpacing: '-0.03em',
                        }}>
                          {featuredItem.avg_overall_score.toFixed(1)}
                        </span>
                      </div>
                      {/* Info */}
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
                    {/* View CTA */}
                    <div style={{
                      marginTop: '20px',
                      padding: '11px 0',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--accent)',
                      color: '#000',
                      fontSize: '14px',
                      fontWeight: 700,
                      textAlign: 'center',
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
          <div style={{ marginBottom: '28px' }}>
            {/* Section header */}
            <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)' }}>Top Rated This Month</span>
              </div>
              <Link href="/leaderboard" style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                See all →
              </Link>
            </div>
            {/* Horizontal scroll */}
            <div style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              paddingLeft: '16px',
              paddingRight: '16px',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            }}>
              {carouselItems.map((item) => {
                const imgSrc = item.flavor_image_url ?? item.product.image_url
                return (
                  <Link
                    key={item.flavor_id}
                    href={`/flavors/${item.slug}`}
                    style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
                  >
                    <div style={{
                      width: '120px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}>
                      {/* Image or gradient placeholder */}
                      <div style={{ position: 'relative', width: '120px', height: '140px', flexShrink: 0 }}>
                        {imgSrc ? (
                          <Image
                            src={imgSrc}
                            alt={item.name}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="120px"
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(160deg, color-mix(in srgb, var(--accent) 30%, var(--bg-elevated)) 0%, color-mix(in srgb, var(--accent) 10%, var(--bg-elevated)) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <span style={{
                              fontSize: '32px',
                              fontWeight: 900,
                              color: 'var(--accent)',
                              opacity: 0.5,
                              letterSpacing: '-0.03em',
                            }}>
                              {(item.product.brands?.name ?? item.name)[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        {/* Rank badge — top right */}
                        {item.rank <= 3 && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            fontSize: '14px',
                            lineHeight: 1,
                          }}>
                            {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                          </div>
                        )}
                      </div>
                      {/* Text */}
                      <div style={{ padding: '10px 10px 12px' }}>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: 900,
                          color: getScoreColor(item.avg_overall_score),
                          lineHeight: 1,
                          marginBottom: '5px',
                          letterSpacing: '-0.02em',
                        }}>
                          {item.avg_overall_score.toFixed(1)}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--text)',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          marginBottom: '4px',
                        }}>
                          {item.name}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--text-dim)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 500,
                        }}>
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

        {/* ── Rate CTA ── */}
        <div style={{ padding: '0 16px', marginBottom: '28px' }}>
          <Link href="/rate" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--accent)',
              color: '#000',
              fontSize: '15px',
              fontWeight: 800,
              textAlign: 'center',
              letterSpacing: '-0.01em',
            }}>
              {user ? 'Rate what you just took →' : 'Start rating supplements →'}
            </div>
          </Link>
        </div>

        {/* ── Community Feed ── */}
        <div>
          {/* Section header */}
          <div style={{ padding: '0 16px', marginBottom: '14px' }}>
            <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)' }}>Community</span>
          </div>

          {/* For You / Following tabs */}
          <div style={{ padding: '0 16px', marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: '999px',
              padding: '4px',
            }}>
              <Link
                href="/?feed=global"
                style={{
                  flex: 1, textAlign: 'center', padding: '8px 0',
                  fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                  borderRadius: '999px',
                  color: !isFollowingTab ? 'var(--text)' : 'var(--text-dim)',
                  backgroundColor: !isFollowingTab ? 'var(--bg-card)' : 'transparent',
                  boxShadow: !isFollowingTab ? 'var(--shadow-sm)' : 'none',
                  transition: 'background-color 0.15s, color 0.15s',
                }}
              >
                For You
              </Link>
              <Link
                href={user ? '/?feed=following' : '/login'}
                style={{
                  flex: 1, textAlign: 'center', padding: '8px 0',
                  fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                  borderRadius: '999px',
                  color: isFollowingTab ? 'var(--text)' : 'var(--text-dim)',
                  backgroundColor: isFollowingTab ? 'var(--bg-card)' : 'transparent',
                  boxShadow: isFollowingTab ? 'var(--shadow-sm)' : 'none',
                  transition: 'background-color 0.15s, color 0.15s',
                }}
              >
                Following
              </Link>
            </div>
          </div>

          {/* Feed items */}
          {feedItems.length === 0 && isFollowingTab ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Nothing here yet</p>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 16 }}>Follow people to see their reviews in this feed.</p>
              <Link href="/browse" style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 700 }}>Browse flavors</Link>
            </div>
          ) : !user && feed === 'following' ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Log in to see your feed</p>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 16 }}>Sign in to follow people and see their reviews here.</p>
              <Link href="/login" style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 700 }}>Log in</Link>
            </div>
          ) : feedItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No reviews yet</p>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 16 }}>Be the first to rate a flavor and share your opinion.</p>
              <Link href="/rate" style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 700 }}>Rate a flavor</Link>
            </div>
          ) : isFollowingTab ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {feedItems.map((feedItem, idx: number) => (
                <FeedCard key={feedItem.id} item={feedItem} initialLikeCount={0} initialLiked={false} index={idx} />
              ))}
            </div>
          ) : (
            <FeedList initialItems={feedItems} initialCursor={initialCursor} userId={user?.id} />
          )}
        </div>

      </div>

      {/* ── Desktop layout (standby — unchanged) ── */}
      <div className="hidden sm:block">

        {/* ── Hero ── */}
        <section style={{
          textAlign: 'center',
          padding: 'clamp(32px, 8vw, 120px) 24px clamp(24px, 5vw, 80px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '16px',
              backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
            }}>
              <svg width="40" height="40" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="40,10 74,70 6,70" fill="var(--text)" />
                <polygon points="42,31 30,51 40,51 35,66 52,46 42,46" fill="var(--bg-elevated)" />
              </svg>
            </div>
          </div>
          <div style={{
            display: 'inline-block', fontSize: '11px', fontWeight: 700, color: 'var(--accent)',
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '20px',
            padding: '4px 12px', borderRadius: '999px', backgroundColor: 'var(--accent-dim)',
            border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)',
          }}>
            Rated by real lifters
          </div>
          <h1 style={{
            fontSize: 'clamp(38px, 7vw, 76px)', fontWeight: 900, lineHeight: 1.0,
            letterSpacing: '-0.03em', margin: '0 auto 20px', maxWidth: '820px', color: 'var(--text)',
          }}>
            Rate it before you{' '}
            <span style={{ color: 'var(--accent)', display: 'inline-block' }}>waste it.</span>
          </h1>
          <p style={{
            fontSize: 'clamp(15px, 2.5vw, 18px)', color: 'var(--text-muted)',
            maxWidth: '480px', margin: '0 auto 48px', lineHeight: 1.7,
          }}>
            FitFlavor is where lifters have a word. Real ratings from real people — on everything in the gym world.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/browse" className="btn btn-primary" style={{ padding: '13px 28px', fontSize: '15px', fontWeight: 700, textDecoration: 'none', borderRadius: 'var(--radius-md)' }}>
              Browse products
            </Link>
            <Link href="/leaderboard" className="btn btn-secondary" style={{ padding: '13px 28px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', borderRadius: 'var(--radius-md)' }}>
              Top rated
            </Link>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '40px 24px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 'clamp(32px, 8vw, 80px)', flexWrap: 'wrap' }}>
            {statItems.map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Top flavors ── */}
        <section style={{ maxWidth: '860px', margin: '0 auto', padding: '72px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '28px', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.01em', color: 'var(--text)' }}>Top Rated Flavors</h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dim)' }}>Ranked by community score</p>
            </div>
            <Link href="/leaderboard" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              View all →
            </Link>
          </div>
          {leaderboard.length === 0 ? (
            <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-dim)', margin: 0 }}>
                No ratings yet —{' '}
                <Link href="/browse" style={{ color: 'var(--accent)', textDecoration: 'none' }}>browse products</Link>
                {' '}and be the first.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {leaderboard.map((item) => (
                <Link key={item.flavor_id} href={`/flavors/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div className="card card-hover" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '32px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: item.rank <= 3 ? 'var(--accent)' : 'var(--text-faint)', flexShrink: 0, letterSpacing: '-0.01em' }}>
                      #{item.rank}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.product.brands?.name} &middot; {item.product.name}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                          {item.tags.slice(0, 3).map((tag) => (
                            <span key={tag.id} className="tag" style={{ fontSize: '11px' }}>{tag.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '26px', fontWeight: 900, color: getScoreColor(item.avg_overall_score), letterSpacing: '-0.02em', lineHeight: 1 }}>
                        {item.avg_overall_score.toFixed(1)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', fontWeight: 500 }}>
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
        <section style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '72px 24px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.01em', color: 'var(--text)' }}>Earn your rank</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '14px', lineHeight: 1.6 }}>Rate more flavors to climb the tiers.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {tiers.map((tier) => (
                <div key={tier.name} className="card" style={{ padding: '18px 22px', minWidth: '110px', textAlign: 'center', borderColor: `color-mix(in srgb, ${tier.color} 30%, var(--border))` }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: tier.color, margin: '0 auto 10px', boxShadow: `0 0 8px ${tier.color}66` }} />
                  <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', color: 'var(--text)' }}>{tier.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 500 }}>{tier.req} ratings</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Categories ── */}
        <section style={{ maxWidth: '760px', margin: '0 auto', padding: '72px 24px 96px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.01em', color: 'var(--text)' }}>More categories on the way</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '14px', lineHeight: 1.6 }}>
            We&apos;re starting with pre-workouts — protein powder and energy drinks are next.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <div key={cat.name} className={cat.active ? 'card card-hover' : 'card'} style={{
                padding: '28px 32px', minWidth: '150px', opacity: cat.active ? 1 : 0.45,
                borderColor: cat.active ? 'color-mix(in srgb, var(--accent) 35%, var(--border))' : 'var(--border)',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '10px', lineHeight: 1 }}>{cat.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px', color: 'var(--text)' }}>{cat.name}</div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: cat.active ? 'var(--accent)' : 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {cat.status}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

    </div>
  )
}
