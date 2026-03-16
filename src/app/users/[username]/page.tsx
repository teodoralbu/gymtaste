export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/Badge'
import { FollowButton } from '@/components/user/FollowButton'
import { BADGE_TIERS, getScoreColor } from '@/lib/constants'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: profile } = await db
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // Follow stats + current user following status
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const [{ count: followerCount }, { count: followingCount }, { data: followCheck }] = await Promise.all([
    db.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    db.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
    currentUser
      ? db.from('follows').select('follower_id').eq('follower_id', currentUser.id).eq('following_id', profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const isFollowing = !!followCheck

  // Get ratings with flavor + product + brand info
  const { data: ratingsRaw } = await db
    .from('ratings')
    .select('*, flavors(id, name, slug, products(name, slug, brands(name)))')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const ratings = (ratingsRaw ?? []) as any[]

  // Stats
  const totalRatings = ratings.length
  const avgScore = totalRatings > 0
    ? ratings.reduce((sum: number, r: any) => sum + r.overall_score, 0) / totalRatings
    : null
  const wouldBuyPct = totalRatings > 0
    ? (ratings.filter((r: any) => r.would_buy_again).length / totalRatings) * 100
    : null

  const tierData = BADGE_TIERS[profile.badge_tier as keyof typeof BADGE_TIERS]
  const joinYear = new Date(profile.created_at).getFullYear()

  const progressPct = tierData.max !== Infinity
    ? Math.min(100, ((totalRatings - tierData.min) / (tierData.max - tierData.min + 1)) * 100)
    : 100

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(16px, 5vw, 48px) 16px 96px' }}>

      {/* Profile header card */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          marginBottom: '16px',
        }}
      >
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}>

          {/* Avatar */}
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-elevated)',
            border: `2px solid ${tierData.color}`,
            boxShadow: `0 0 16px ${tierData.color}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 900,
            color: tierData.color,
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              profile.username[0].toUpperCase()
            )}
          </div>

          {/* Name + badge + follow */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 900,
              margin: '0 0 8px',
              color: 'var(--text)',
              lineHeight: 1.2,
            }}>
              {profile.username}
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px',
              flexWrap: 'wrap',
            }}>
              <Badge tier={profile.badge_tier} size="md" />
              <FollowButton targetUserId={profile.id} initialFollowing={isFollowing} />
            </div>
            {profile.bio && (
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '14px',
                lineHeight: 1.6,
                margin: '0 0 10px',
              }}>
                {profile.bio}
              </p>
            )}
            <div style={{
              fontSize: '12px',
              color: 'var(--text-faint)',
              fontWeight: 500,
            }}>
              Member since {joinYear}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          backgroundColor: 'var(--border-soft)',
          margin: '24px 0',
        }} />

        {/* Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${avgScore !== null ? 4 : 3}, 1fr)`,
          gap: '8px',
        }}>
          {[
            { value: totalRatings, label: 'Ratings', color: 'var(--text)' },
            ...(avgScore !== null
              ? [{ value: avgScore.toFixed(1), label: 'Avg Score', color: getScoreColor(avgScore) }]
              : []),
            { value: followerCount ?? 0, label: 'Followers', color: 'var(--text)' },
            { value: followingCount ?? 0, label: 'Following', color: 'var(--text)' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{
                fontSize: '26px',
                fontWeight: 900,
                color: stat.color,
                lineHeight: 1,
                marginBottom: '5px',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '10px',
                color: 'var(--text-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                fontWeight: 600,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badge progress card */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 24px',
          marginBottom: '32px',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            color: tierData.color,
            letterSpacing: '0.02em',
          }}>
            {tierData.name}
          </div>
          {tierData.max !== Infinity && (
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 500 }}>
              {totalRatings} / {tierData.max + 1} ratings to next tier
            </div>
          )}
        </div>

        {tierData.max !== Infinity ? (
          <div style={{
            height: '5px',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              backgroundColor: tierData.color,
              borderRadius: '999px',
              boxShadow: `0 0 8px ${tierData.color}88`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        ) : (
          <div style={{
            fontSize: '12px',
            color: 'var(--text-faint)',
            fontStyle: 'italic',
          }}>
            Maximum tier reached.
          </div>
        )}
      </div>

      {/* Ratings list */}
      <div>
        <h2 style={{
          fontSize: '17px',
          fontWeight: 800,
          marginBottom: '16px',
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
        }}>
          Ratings
          <span style={{
            color: 'var(--text-faint)',
            fontWeight: 400,
            fontSize: '13px',
          }}>
            ({totalRatings})
          </span>
        </h2>

        {ratings.length === 0 ? (
          <div
            className="card"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '40px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              No ratings yet.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ratings.map((rating: any) => {
              const flavor = rating.flavors
              const product = flavor?.products
              const brand = product?.brands

              return (
                <Link
                  key={rating.id}
                  href={`/flavors/${flavor?.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    className="card-hover"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      transition: 'background-color 150ms ease, border-color 150ms ease',
                    }}
                  >
                    {/* Flavor info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: 'var(--text)',
                        marginBottom: '3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {flavor?.name ?? 'Unknown flavor'}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--text-faint)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                        marginBottom: rating.review_text ? '6px' : 0,
                      }}>
                        {brand?.name} · {product?.name}
                      </div>
                      {rating.review_text && (
                        <div style={{
                          fontSize: '13px',
                          color: 'var(--text-dim)',
                          lineHeight: 1.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                        }}>
                          {rating.review_text}
                        </div>
                      )}
                    </div>

                    {/* Score block */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontSize: '22px',
                        fontWeight: 900,
                        color: getScoreColor(rating.overall_score),
                        lineHeight: 1,
                        marginBottom: '3px',
                      }}>
                        {rating.overall_score.toFixed(1)}
                      </div>
                      {rating.would_buy_again && (
                        <div style={{
                          fontSize: '10px',
                          color: 'var(--green)',
                          fontWeight: 700,
                          letterSpacing: '0.03em',
                        }}>
                          WBA
                        </div>
                      )}
                    </div>

                    {/* Chevron */}
                    <div style={{
                      color: 'var(--text-faint)',
                      flexShrink: 0,
                      fontSize: '16px',
                      lineHeight: 1,
                    }}>
                      ›
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
