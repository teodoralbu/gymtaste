'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  // Get user's last_notifications_seen_at
  const { data: profile } = await supabase
    .from('users')
    .select('id, last_notifications_seen_at')
    .eq('id', user.id)
    .single()

  if (!profile) return 0

  const lastSeen = profile.last_notifications_seen_at as string | null

  // Get user's rating IDs (needed for likes/comments)
  const { data: myRatings } = await supabase
    .from('ratings')
    .select('id')
    .eq('user_id', user.id)
    .limit(200)

  const myRatingIds = (myRatings ?? []).map((r: { id: string }) => r.id)

  // Count notifications newer than lastSeen, in parallel
  const sinceFilter = lastSeen ? lastSeen : '1970-01-01T00:00:00Z'

  const [likesResult, commentsResult, followsResult] = await Promise.all([
    myRatingIds.length > 0
      ? supabase
          .from('review_likes')
          .select('*', { count: 'exact', head: true })
          .in('rating_id', myRatingIds)
          .neq('user_id', user.id)
          .gt('created_at', sinceFilter)
      : Promise.resolve({ count: 0 }),
    myRatingIds.length > 0
      ? supabase
          .from('review_comments')
          .select('*', { count: 'exact', head: true })
          .in('rating_id', myRatingIds)
          .neq('user_id', user.id)
          .gt('created_at', sinceFilter)
      : Promise.resolve({ count: 0 }),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id)
      .gt('created_at', sinceFilter),
  ])

  return (likesResult.count ?? 0) + (commentsResult.count ?? 0) + (followsResult.count ?? 0)
}

export async function markNotificationsSeen(): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('users')
    .update({ last_notifications_seen_at: new Date().toISOString() })
    .eq('id', user.id)
}
