import { createServerSupabaseClient } from './supabase-server'
import type { Brand, Product, Flavor, FlavorTag, Rating, User } from './types'

// ─── Product ────────────────────────────────────────────────────────────────

export async function getProductBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: product } = await db
    .from('products')
    .select('*, brands(*)')
    .eq('slug', slug)
    .eq('is_approved', true)
    .single()

  if (!product) return null

  const { data: flavors } = await db
    .from('flavors')
    .select('*, flavor_tag_assignments(flavor_tags(*))')
    .eq('product_id', product.id)
    .order('name')

  const flavorIds = ((flavors ?? []) as any[]).map((f) => f.id)
  const ratingStats: Record<string, { avg: number; count: number; wba_pct: number }> = {}

  if (flavorIds.length > 0) {
    const { data: ratings } = await db
      .from('ratings')
      .select('flavor_id, overall_score, would_buy_again')
      .in('flavor_id', flavorIds)

    if (ratings) {
      const grouped: Record<string, any[]> = {}
      for (const r of ratings as any[]) {
        if (!grouped[r.flavor_id]) grouped[r.flavor_id] = []
        grouped[r.flavor_id].push(r)
      }
      for (const [fid, rs] of Object.entries(grouped)) {
        const avg = rs.reduce((sum, r) => sum + r.overall_score, 0) / rs.length
        const wba = rs.filter((r) => r.would_buy_again).length / rs.length
        ratingStats[fid] = { avg, count: rs.length, wba_pct: wba * 100 }
      }
    }
  }

  return {
    product: product as Product & { brands: Brand },
    flavors: ((flavors ?? []) as any[]).map((f) => ({
      id: f.id as string,
      product_id: f.product_id as string,
      name: f.name as string,
      slug: f.slug as string,
      created_at: f.created_at as string,
      tags: (f.flavor_tag_assignments as any[])
        ?.map((a) => a.flavor_tags)
        .filter(Boolean) as FlavorTag[],
      avg_overall_score: ratingStats[f.id]?.avg ?? null,
      rating_count: ratingStats[f.id]?.count ?? 0,
      would_buy_again_pct: ratingStats[f.id]?.wba_pct ?? null,
    })),
  }
}

// ─── Flavor ─────────────────────────────────────────────────────────────────

export async function getFlavorBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: flavor } = await db
    .from('flavors')
    .select('*, products(*, brands(*)), flavor_tag_assignments(flavor_tags(*))')
    .eq('slug', slug)
    .single()

  if (!flavor) return null

  const { data: ratingsRaw } = await db
    .from('ratings')
    .select('*')
    .eq('flavor_id', flavor.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const allRatings = (ratingsRaw ?? []) as any[]

  // Fetch user profiles separately
  const userIds = [...new Set(allRatings.map((r: any) => r.user_id))]
  const userMap: Record<string, any> = {}
  if (userIds.length > 0) {
    const { data: users } = await db
      .from('users')
      .select('id, username, badge_tier, avatar_url')
      .in('id', userIds)
    for (const u of (users ?? []) as any[]) {
      userMap[u.id] = u
    }
  }

  // Fetch like counts per rating
  const ratingIds = allRatings.map((r: any) => r.id)
  const likeCountMap: Record<string, number> = {}
  if (ratingIds.length > 0) {
    const { data: likes } = await db
      .from('review_likes')
      .select('rating_id')
      .in('rating_id', ratingIds)
    for (const l of (likes ?? []) as any[]) {
      likeCountMap[l.rating_id] = (likeCountMap[l.rating_id] ?? 0) + 1
    }
  }

  // Get current user session to check liked status
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const likedByMe = new Set<string>()
  if (currentUser && ratingIds.length > 0) {
    const { data: myLikes } = await db
      .from('review_likes')
      .select('rating_id')
      .eq('user_id', currentUser.id)
      .in('rating_id', ratingIds)
    for (const l of (myLikes ?? []) as any[]) {
      likedByMe.add(l.rating_id)
    }
  }
  // Get sibling flavors from same product
  const { data: siblingFlavors } = await (supabase as any)
    .from('flavors')
    .select('id, name, slug')
    .eq('product_id', flavor.product_id)
    .neq('id', flavor.id)
    .order('name')
    .limit(20)

  const avg =
    allRatings.length > 0
      ? allRatings.reduce((sum: number, r: any) => sum + r.overall_score, 0) / allRatings.length
      : null
  const wba_pct =
    allRatings.length > 0
      ? (allRatings.filter((r: any) => r.would_buy_again).length / allRatings.length) * 100
      : null

  return {
    siblingFlavors: (siblingFlavors ?? []) as { id: string; name: string; slug: string }[],
    flavor: {
      id: flavor.id as string,
      product_id: flavor.product_id as string,
      name: flavor.name as string,
      slug: flavor.slug as string,
      created_at: flavor.created_at as string,
      tags: (flavor.flavor_tag_assignments as any[])
        ?.map((a: any) => a.flavor_tags)
        .filter(Boolean) as FlavorTag[],
      avg_overall_score: avg,
      rating_count: allRatings.length,
      would_buy_again_pct: wba_pct,
      product: flavor.products as Product & { brands: Brand },
    },
    ratings: allRatings.map((r: any) => ({
      ...r,
      user: userMap[r.user_id] as User ?? null,
      like_count: likeCountMap[r.id] ?? 0,
      user_has_liked: likedByMe.has(r.id),
    })) as (Rating & { user: User; like_count: number; user_has_liked: boolean })[],
  }
}

// ─── Leaderboard ────────────────────────────────────────────────────────────

export async function getLeaderboard(limit = 20) {
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: ratings } = await db
    .from('ratings')
    .select('flavor_id, overall_score, would_buy_again')

  if (!ratings || ratings.length === 0) return []

  const grouped: Record<string, any[]> = {}
  for (const r of ratings as any[]) {
    if (!grouped[r.flavor_id]) grouped[r.flavor_id] = []
    grouped[r.flavor_id].push(r)
  }

  const aggregated = Object.entries(grouped)
    .filter(([, rs]) => rs.length >= 1)
    .map(([flavor_id, rs]) => ({
      flavor_id,
      avg: rs.reduce((sum, r) => sum + r.overall_score, 0) / rs.length,
      count: rs.length,
      wba_pct: (rs.filter((r) => r.would_buy_again).length / rs.length) * 100,
    }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .slice(0, limit)

  if (aggregated.length === 0) return []

  const flavorIds = aggregated.map((a) => a.flavor_id)
  const { data: flavors } = await db
    .from('flavors')
    .select('*, products(*, brands(*)), flavor_tag_assignments(flavor_tags(*))')
    .in('id', flavorIds)

  if (!flavors) return []

  const flavorMap: Record<string, any> = {}
  for (const f of flavors as any[]) {
    flavorMap[f.id] = f
  }

  return aggregated
    .filter((a) => flavorMap[a.flavor_id])
    .map((a, idx) => ({
      rank: idx + 1,
      flavor_id: a.flavor_id,
      name: flavorMap[a.flavor_id].name as string,
      slug: flavorMap[a.flavor_id].slug as string,
      tags: (flavorMap[a.flavor_id].flavor_tag_assignments as any[])
        ?.map((t: any) => t.flavor_tags)
        .filter(Boolean) as FlavorTag[],
      avg_overall_score: a.avg,
      rating_count: a.count,
      would_buy_again_pct: a.wba_pct,
      product: flavorMap[a.flavor_id].products as Product & { brands: Brand },
    }))
}

// ─── Browse products ─────────────────────────────────────────────────────────

export async function getProductsWithFlavors(categorySlug?: string) {
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  let query = db
    .from('products')
    .select('*, brands(*), categories(*)')
    .eq('is_approved', true)
    .order('name')

  if (categorySlug) {
    const { data: cat } = await db
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  const { data: products } = await query

  return (products ?? []) as (Product & { brands: Brand; categories: { name: string; slug: string; icon: string } })[]
}

// ─── Recent Ratings ──────────────────────────────────────────────────────────

export async function getRecentRatings(limit = 20) {
  const supabase = await createServerSupabaseClient()
  const db = supabase as any

  const { data: ratings } = await db
    .from('ratings')
    .select('id, overall_score, would_buy_again, review_text, created_at, flavor_id, user_id')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!ratings || ratings.length === 0) return []

  const flavorIds = ratings.map((r: any) => r.flavor_id)
  const userIds = ratings.map((r: any) => r.user_id)

  const [{ data: flavors }, { data: users }] = await Promise.all([
    db.from('flavors').select('id, name, slug, product_id, products(name, slug, brands(name))').in('id', flavorIds),
    db.from('users').select('id, username, avatar_url, badge_tier').in('id', userIds),
  ])

  const flavorMap: Record<string, any> = {}
  for (const f of (flavors ?? []) as any[]) flavorMap[f.id] = f

  const userMap: Record<string, any> = {}
  for (const u of (users ?? []) as any[]) userMap[u.id] = u

  return ratings.map((r: any) => ({
    id: r.id as string,
    overall_score: r.overall_score as number,
    would_buy_again: r.would_buy_again as boolean,
    review_text: r.review_text as string | null,
    created_at: r.created_at as string,
    flavor: flavorMap[r.flavor_id] ?? null,
    user: userMap[r.user_id] ?? null,
  }))
}
