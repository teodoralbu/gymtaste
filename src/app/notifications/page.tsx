export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { timeAgo } from '@/lib/timeAgo'

interface NotificationItem {
  id: string
  type: 'like' | 'comment' | 'follow'
  created_at: string
  actor_username: string
  actor_avatar: string | null
  flavor_name?: string
  flavor_slug?: string
  comment_preview?: string
}

async function getNotifications(userId: string): Promise<NotificationItem[]> {
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Step 1: get this user's rating IDs + their flavor IDs
  const { data: myRatings } = await db
    .from('ratings')
    .select('id, flavor_id')
    .eq('user_id', userId)
    .limit(200)

  const myRatingIds = ((myRatings ?? []) as any[]).map((r: any) => r.id)
  const ratingIdToFlavorId: Record<string, string> = {}
  for (const r of (myRatings ?? []) as any[]) ratingIdToFlavorId[r.id] = r.flavor_id

  // Step 2: fetch likes, comments, follows in parallel
  const [likesResult, commentsResult, followsResult] = await Promise.all([
    myRatingIds.length > 0
      ? db
          .from('review_likes')
          .select('id, created_at, user_id, rating_id')
          .in('rating_id', myRatingIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] }),

    myRatingIds.length > 0
      ? db
          .from('review_comments')
          .select('id, created_at, text, user_id, rating_id')
          .in('rating_id', myRatingIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] }),

    db
      .from('follows')
      .select('id, created_at, follower_id')
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  // Step 3: collect actor IDs and flavor IDs
  const actorIds = new Set<string>()
  for (const l of (likesResult.data ?? []) as any[]) actorIds.add(l.user_id)
  for (const c of (commentsResult.data ?? []) as any[]) actorIds.add(c.user_id)
  for (const f of (followsResult.data ?? []) as any[]) actorIds.add(f.follower_id)

  const flavorIds = [...new Set(Object.values(ratingIdToFlavorId))]

  const [usersResult, flavorsResult] = await Promise.all([
    actorIds.size > 0
      ? db.from('users').select('id, username, avatar_url').in('id', [...actorIds])
      : Promise.resolve({ data: [] }),
    flavorIds.length > 0
      ? db.from('flavors').select('id, name, slug').in('id', flavorIds)
      : Promise.resolve({ data: [] }),
  ])

  const userMap: Record<string, any> = {}
  for (const u of (usersResult.data ?? []) as any[]) userMap[u.id] = u

  const flavorMap: Record<string, any> = {}
  for (const f of (flavorsResult.data ?? []) as any[]) flavorMap[f.id] = f

  const items: NotificationItem[] = []

  for (const l of (likesResult.data ?? []) as any[]) {
    const actor = userMap[l.user_id]
    if (!actor) continue
    const flavor = flavorMap[ratingIdToFlavorId[l.rating_id]]
    items.push({
      id: `like-${l.id}`,
      type: 'like',
      created_at: l.created_at,
      actor_username: actor.username,
      actor_avatar: actor.avatar_url ?? null,
      flavor_name: flavor?.name ?? 'a flavor',
      flavor_slug: flavor?.slug ?? '',
    })
  }

  for (const c of (commentsResult.data ?? []) as any[]) {
    const actor = userMap[c.user_id]
    if (!actor) continue
    const flavor = flavorMap[ratingIdToFlavorId[c.rating_id]]
    items.push({
      id: `comment-${c.id}`,
      type: 'comment',
      created_at: c.created_at,
      actor_username: actor.username,
      actor_avatar: actor.avatar_url ?? null,
      flavor_name: flavor?.name ?? 'a flavor',
      flavor_slug: flavor?.slug ?? '',
      comment_preview: (c.text as string)?.slice(0, 60) ?? '',
    })
  }

  for (const f of (followsResult.data ?? []) as any[]) {
    const actor = userMap[f.follower_id]
    if (!actor) continue
    items.push({
      id: `follow-${f.id}`,
      type: 'follow',
      created_at: f.created_at,
      actor_username: actor.username,
      actor_avatar: actor.avatar_url ?? null,
    })
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return items.slice(0, 50)
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '64px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.5 }}>🔔</div>
        <p style={{ color: 'var(--text-dim)', fontSize: '15px', margin: '0 0 20px' }}>
          Log in to see notifications
        </p>
        <Link
          href="/login"
          style={{
            display: 'inline-block', backgroundColor: 'var(--accent)', color: '#000',
            fontWeight: 700, fontSize: '14px', padding: '11px 24px',
            borderRadius: 'var(--radius-md)', textDecoration: 'none',
          }}
        >
          Log in
        </Link>
      </div>
    )
  }

  const notifications = await getNotifications(user.id)

  // Split into Today / Earlier
  const todayItems = notifications.filter((n) => isToday(n.created_at))
  const earlierItems = notifications.filter((n) => !isToday(n.created_at))

  const groups: Array<{ label: string; items: NotificationItem[] }> = []
  if (todayItems.length > 0) groups.push({ label: 'Today', items: todayItems })
  if (earlierItems.length > 0) groups.push({ label: 'Earlier', items: earlierItems })

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px 0 96px' }}>

      {/* Header */}
      <div style={{ padding: '8px 16px 20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Notifications
        </h1>
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: '48px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>🔔</div>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', margin: 0 }}>No notifications yet.</p>
        </div>
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.label} style={{ marginBottom: '8px' }}>

              {/* Group header */}
              <div style={{
                padding: '4px 16px 8px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {group.label}
              </div>

              {/* Group items */}
              <div style={{
                backgroundColor: 'var(--bg-card)',
                marginLeft: '16px',
                marginRight: '16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}>
                {group.items.map((notif, idx) => {
                  const href = notif.type === 'follow'
                    ? `/users/${notif.actor_username}`
                    : `/flavors/${notif.flavor_slug}`

                  return (
                    <Link
                      key={notif.id}
                      href={href}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '14px 16px',
                        minHeight: '60px',
                        textDecoration: 'none',
                        color: 'inherit',
                        borderTop: idx > 0 ? '1px solid var(--border-soft)' : 'none',
                        boxSizing: 'border-box',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 800, color: 'var(--accent)', overflow: 'hidden',
                        marginTop: '1px',
                      }}>
                        {notif.actor_avatar ? (
                          <Image src={notif.actor_avatar} alt={`${notif.actor_username}'s avatar`} width={36} height={36} style={{ objectFit: 'cover' }} />
                        ) : (
                          notif.actor_username[0]?.toUpperCase() ?? '?'
                        )}
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: 0,
                          fontSize: '13px',
                          color: 'var(--text)',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          <span style={{ fontWeight: 700 }}>{notif.actor_username}</span>
                          {notif.type === 'like' && (
                            <> liked your review of <span style={{ fontWeight: 600 }}>{notif.flavor_name}</span></>
                          )}
                          {notif.type === 'comment' && (
                            <> commented on <span style={{ fontWeight: 600 }}>{notif.flavor_name}</span>
                              {notif.comment_preview && (
                                <span style={{ color: 'var(--text-muted)' }}> — &ldquo;{notif.comment_preview}&rdquo;</span>
                              )}
                            </>
                          )}
                          {notif.type === 'follow' && <> started following you</>}
                        </p>
                      </div>

                      {/* Time */}
                      <span style={{
                        fontSize: '11px',
                        color: 'var(--text-faint)',
                        flexShrink: 0,
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                      }}>
                        {timeAgo(notif.created_at)}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
