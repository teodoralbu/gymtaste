'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function loadMoreFeed(cursor: string, userId?: string) {
  const supabase = await createServerSupabaseClient()
  const db = supabase as any

  const { data: ratings } = await db
    .from('ratings')
    .select('id, overall_score, would_buy_again, review_text, photo_url, created_at, flavor_id, user_id, scores, context_tags, value_score')
    .lt('created_at', cursor)
    .eq('schema_version', 2)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!ratings || ratings.length === 0) return { items: [], nextCursor: null }

  const flavorIds = (ratings as any[]).map((r) => r.flavor_id)
  const userIds = (ratings as any[]).map((r) => r.user_id)
  const ratingIds = (ratings as any[]).map((r) => r.id)

  const [{ data: flavors }, { data: ratingUsers }, { data: commentCounts }, { data: allLikes }] = await Promise.all([
    db.from('flavors').select('id, name, slug, product_id, products(id, name, slug, image_url, brands(name))').in('id', flavorIds),
    db.from('users').select('id, username, avatar_url, badge_tier').in('id', userIds),
    db.from('review_comments').select('rating_id').in('rating_id', ratingIds),
    db.from('review_likes').select('rating_id, user_id').in('rating_id', ratingIds),
  ])

  const flavorMap: Record<string, any> = {}
  for (const f of (flavors ?? []) as any[]) flavorMap[f.id] = f

  const ratingUserMap: Record<string, any> = {}
  for (const u of (ratingUsers ?? []) as any[]) ratingUserMap[u.id] = u

  const commentCountMap: Record<string, number> = {}
  for (const c of (commentCounts ?? []) as any[]) {
    commentCountMap[c.rating_id] = (commentCountMap[c.rating_id] ?? 0) + 1
  }

  const likeCountMap: Record<string, number> = {}
  const likedByMe = new Set<string>()
  for (const l of (allLikes ?? []) as any[]) {
    likeCountMap[l.rating_id] = (likeCountMap[l.rating_id] ?? 0) + 1
    if (userId && l.user_id === userId) likedByMe.add(l.rating_id)
  }

  const items = (ratings as any[]).map((r) => ({
    _type: 'rating' as const,
    id: r.id as string,
    overall_score: r.overall_score as number,
    would_buy_again: r.would_buy_again as boolean,
    review_text: r.review_text as string | null,
    photo_url: r.photo_url as string | null,
    created_at: r.created_at as string,
    scores: r.scores as Record<string, number> | null,
    context_tags: r.context_tags as string[] | null,
    value_score: (r as any).value_score ?? null,
    comment_count: commentCountMap[r.id] ?? 0,
    like_count: likeCountMap[r.id] ?? 0,
    user_has_liked: likedByMe.has(r.id),
    flavor: flavorMap[r.flavor_id] ?? null,
    user: ratingUserMap[r.user_id] ?? null,
  }))

  const nextCursor = ratings.length === 20 ? ratings[ratings.length - 1].created_at : null

  return { items, nextCursor }
}
