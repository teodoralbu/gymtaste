import { createServerSupabaseClient } from './supabase-server'
import { MIN_RATINGS_FOR_LEADERBOARD } from './constants'
import type { Brand, Product, Flavor, FlavorTag, Rating, User, Category } from './types'

// ─── Join result interfaces (Supabase can't infer without Relationships metadata) ──

interface FlavorWithTagAssignments {
  id: string
  product_id: string
  name: string
  slug: string
  created_at: string
  image_url: string | null
  flavor_tag_assignments: { flavor_tags: { id: string; name: string; slug: string } }[]
}

interface ProductWithBrandRow {
  id: string
  brand_id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  caffeine_mg: number | null
  citrulline_g: number | null
  beta_alanine_g: number | null
  price_per_serving: number | null
  servings_per_container: number | null
  barcode: string | null
  is_approved: boolean
  submitted_by: string | null
  created_at: string
  brands: Brand
}

interface FlavorWithProductAndTags extends FlavorWithTagAssignments {
  products: Product & { brands: Brand }
}

interface RatingRow {
  flavor_id: string
  overall_score: number
  would_buy_again: boolean
}

interface UserBasic {
  id: string
  username: string
  avatar_url: string | null
  badge_tier: string
}

interface ReviewLikeRow {
  rating_id: string
  user_id?: string
}

interface CommentCountRow {
  rating_id: string
}

interface FlavorWithProductForFeed {
  id: string
  name: string
  slug: string
  product_id: string
  products: {
    id: string
    name: string
    slug: string
    image_url: string | null
    brands: { name: string }
  }
}

interface FollowRow {
  following_id: string
}

interface FeedRatingRow {
  id: string
  overall_score: number
  would_buy_again: boolean
  review_text: string | null
  photo_url: string | null
  created_at: string
  flavor_id: string
  user_id: string
  scores: Record<string, number> | null
  context_tags: string[] | null
  value_score: number | null
}

interface ProductWithBrandAndCategory extends ProductWithBrandRow {
  categories: { name: string; slug: string; icon: string }
}

interface UserIdRow {
  user_id: string
}

// ─── Product ────────────────────────────────────────────────────────────────

export async function getProductBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*, brands(*)')
    .eq('slug', slug)
    .eq('is_approved', true)
    .returns<ProductWithBrandRow[]>()
    .single()

  if (productError) {
    console.error('[getProductBySlug] product query failed:', productError.message)
    return null
  }

  if (!product) return null

  const { data: flavors, error: flavorsError } = await supabase
    .from('flavors')
    .select('*, flavor_tag_assignments(flavor_tags(*))')
    .eq('product_id', product.id)
    .order('name')
    .returns<FlavorWithTagAssignments[]>()

  if (flavorsError) {
    console.error('[getProductBySlug] flavors query failed:', flavorsError.message)
    return null
  }

  const flavorIds = (flavors ?? []).map((f) => f.id)
  const ratingStats: Record<string, { avg: number; count: number; wba_pct: number }> = {}

  if (flavorIds.length > 0) {
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('flavor_id, overall_score, would_buy_again')
      .in('flavor_id', flavorIds)
      .eq('schema_version', 2)
      .returns<RatingRow[]>()

    if (ratingsError) {
      console.error('[getProductBySlug] ratings query failed:', ratingsError.message)
      return null
    }

    if (ratings) {
      const grouped: Record<string, RatingRow[]> = {}
      for (const r of ratings) {
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
    flavors: (flavors ?? []).map((f) => ({
      id: f.id,
      product_id: f.product_id,
      name: f.name,
      slug: f.slug,
      created_at: f.created_at,
      tags: f.flavor_tag_assignments
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

  const { data: flavor, error: flavorError } = await supabase
    .from('flavors')
    .select('*, products(*, brands(*)), flavor_tag_assignments(flavor_tags(*))')
    .eq('slug', slug)
    .returns<FlavorWithProductAndTags[]>()
    .single()

  if (flavorError) {
    console.error('[getFlavorBySlug] flavor query failed:', flavorError.message)
    return null
  }

  if (!flavor) return null

  // Batch 1: ratings, siblings, and auth can all run in parallel (depend only on flavor)
  const [ratingsResult, siblingsResult, authResult] = await Promise.all([
    supabase.from('ratings').select('*').eq('flavor_id', flavor.id).eq('schema_version', 2).order('created_at', { ascending: false }).limit(20),
    supabase.from('flavors').select('id, name, slug').eq('product_id', flavor.product_id).neq('id', flavor.id).order('name').limit(20),
    supabase.auth.getUser(),
  ])

  if (ratingsResult.error) {
    console.error('[getFlavorBySlug] ratings query failed:', ratingsResult.error.message)
    return null
  }
  if (siblingsResult.error) {
    console.error('[getFlavorBySlug] siblings query failed:', siblingsResult.error.message)
    return null
  }

  const allRatings = (ratingsResult.data ?? []) as Rating[]
  const siblingFlavors = (siblingsResult.data ?? []) as { id: string; name: string; slug: string }[]
  const currentUser = authResult.data?.user ?? null

  const userIds = [...new Set(allRatings.map((r) => r.user_id))]
  const ratingIds = allRatings.map((r) => r.id)

  // Batch 2: users, likes, and myLikes can all run in parallel (depend on ratingsRaw)
  const [usersResult, likesResult, myLikesResult] = await Promise.all([
    userIds.length > 0
      ? supabase.from('users').select('id, username, badge_tier, avatar_url').in('id', userIds).returns<UserBasic[]>()
      : Promise.resolve({ data: [] as UserBasic[], error: null }),
    ratingIds.length > 0
      ? supabase.from('review_likes').select('rating_id').in('rating_id', ratingIds).returns<ReviewLikeRow[]>()
      : Promise.resolve({ data: [] as ReviewLikeRow[], error: null }),
    currentUser && ratingIds.length > 0
      ? supabase.from('review_likes').select('rating_id').eq('user_id', currentUser.id).in('rating_id', ratingIds).returns<ReviewLikeRow[]>()
      : Promise.resolve({ data: [] as ReviewLikeRow[], error: null }),
  ])

  if (usersResult.error) {
    console.error('[getFlavorBySlug] users query failed:', usersResult.error.message)
  }
  if (likesResult.error) {
    console.error('[getFlavorBySlug] likes query failed:', likesResult.error.message)
  }
  if (myLikesResult.error) {
    console.error('[getFlavorBySlug] myLikes query failed:', myLikesResult.error.message)
  }

  const userMap: Record<string, UserBasic> = {}
  for (const u of (usersResult.data ?? [])) userMap[u.id] = u

  const likeCountMap: Record<string, number> = {}
  for (const l of (likesResult.data ?? [])) {
    likeCountMap[l.rating_id] = (likeCountMap[l.rating_id] ?? 0) + 1
  }

  const likedByMe = new Set<string>()
  for (const l of (myLikesResult.data ?? [])) likedByMe.add(l.rating_id)

  const avg =
    allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.overall_score, 0) / allRatings.length
      : null
  const wba_pct =
    allRatings.length > 0
      ? (allRatings.filter((r) => r.would_buy_again).length / allRatings.length) * 100
      : null

  return {
    siblingFlavors,
    flavor: {
      id: flavor.id,
      product_id: flavor.product_id,
      name: flavor.name,
      slug: flavor.slug,
      created_at: flavor.created_at,
      tags: flavor.flavor_tag_assignments
        ?.map((a) => a.flavor_tags)
        .filter(Boolean) as FlavorTag[],
      avg_overall_score: avg,
      rating_count: allRatings.length,
      would_buy_again_pct: wba_pct,
      product: flavor.products as Product & { brands: Brand },
    },
    ratings: allRatings.map((r) => ({
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

  const { data: ratings, error: ratingsError } = await supabase
    .from('ratings')
    .select('flavor_id, overall_score, would_buy_again')
    .eq('schema_version', 2)
    .order('created_at', { ascending: false })
    .limit(2000)
    .returns<RatingRow[]>()

  if (ratingsError) {
    console.error('[getLeaderboard] ratings query failed:', ratingsError.message)
    return []
  }

  if (!ratings || ratings.length === 0) return []

  const grouped: Record<string, RatingRow[]> = {}
  for (const r of ratings) {
    if (!grouped[r.flavor_id]) grouped[r.flavor_id] = []
    grouped[r.flavor_id].push(r)
  }

  const aggregated = Object.entries(grouped)
    .filter(([, rs]) => rs.length >= MIN_RATINGS_FOR_LEADERBOARD)
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
  const { data: flavors, error: flavorsError } = await supabase
    .from('flavors')
    .select('*, products(*, brands(*)), flavor_tag_assignments(flavor_tags(*))')
    .in('id', flavorIds)
    .returns<FlavorWithProductAndTags[]>()

  if (flavorsError) {
    console.error('[getLeaderboard] flavors query failed:', flavorsError.message)
    return []
  }

  if (!flavors) return []

  const flavorMap: Record<string, FlavorWithProductAndTags> = {}
  for (const f of flavors) flavorMap[f.id] = f

  return aggregated
    .filter((a) => flavorMap[a.flavor_id])
    .map((a, idx) => ({
      rank: idx + 1,
      flavor_id: a.flavor_id,
      name: flavorMap[a.flavor_id].name,
      slug: flavorMap[a.flavor_id].slug,
      tags: flavorMap[a.flavor_id].flavor_tag_assignments
        ?.map((t) => t.flavor_tags)
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

  let query = supabase
    .from('products')
    .select('*, brands(*), categories(*)')
    .eq('is_approved', true)
    .order('name')

  if (categorySlug) {
    const catResult = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .limit(1)
      .returns<{ id: string }[]>()

    if (catResult.error) {
      console.error('[getProductsWithFlavors] category query failed:', catResult.error.message)
      return []
    }
    const cat = catResult.data?.[0]
    if (cat) query = query.eq('category_id', cat.id)
  }

  const { data: products, error: productsError } = await query.returns<ProductWithBrandAndCategory[]>()

  if (productsError) {
    console.error('[getProductsWithFlavors] products query failed:', productsError.message)
    return []
  }

  return (products ?? []) as (Product & { brands: Brand; categories: { name: string; slug: string; icon: string } })[]
}

// ─── Top Reviewers (by rating count) ────────────────────────────────────────

export async function getTopReviewers(limit = 10) {
  const supabase = await createServerSupabaseClient()

  const { data: ratings, error: ratingsError } = await supabase
    .from('ratings')
    .select('user_id')
    .order('created_at', { ascending: false })
    .limit(2000)
    .returns<UserIdRow[]>()

  if (ratingsError) {
    console.error('[getTopReviewers] ratings query failed:', ratingsError.message)
    return []
  }

  if (!ratings || ratings.length === 0) return []

  const countMap: Record<string, number> = {}
  for (const r of ratings) {
    countMap[r.user_id] = (countMap[r.user_id] ?? 0) + 1
  }

  const sorted = Object.entries(countMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)

  if (sorted.length === 0) return []

  const userIds = sorted.map(([id]) => id)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, avatar_url, badge_tier')
    .in('id', userIds)
    .returns<UserBasic[]>()

  if (usersError) {
    console.error('[getTopReviewers] users query failed:', usersError.message)
    return []
  }

  const userMap: Record<string, UserBasic> = {}
  for (const u of (users ?? [])) userMap[u.id] = u

  return sorted
    .map(([id, count]) => ({ ...userMap[id], rating_count: count }))
    .filter((u) => u.username) as {
      id: string
      username: string
      avatar_url: string | null
      badge_tier: string
      rating_count: number
    }[]
}

// ─── Home feed (ratings only) ────────────────────────────────────────────────

export async function getUnifiedFeed(limit = 30, userId?: string) {
  const supabase = await createServerSupabaseClient()

  const { data: ratings, error: ratingsError } = await supabase
    .from('ratings')
    .select('id, overall_score, would_buy_again, review_text, photo_url, created_at, flavor_id, user_id, scores, context_tags, value_score')
    .eq('schema_version', 2)
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<FeedRatingRow[]>()

  if (ratingsError) {
    console.error('[getUnifiedFeed] ratings query failed:', ratingsError.message)
    return []
  }

  if (!ratings || ratings.length === 0) return []

  const flavorIds = ratings.map((r) => r.flavor_id)
  const userIds = ratings.map((r) => r.user_id)
  const ratingIds = ratings.map((r) => r.id)

  const [flavorsResult, ratingUsersResult, commentCountsResult, allLikesResult] = await Promise.all([
    supabase.from('flavors').select('id, name, slug, product_id, products(id, name, slug, image_url, brands(name))').in('id', flavorIds).returns<FlavorWithProductForFeed[]>(),
    supabase.from('users').select('id, username, avatar_url, badge_tier').in('id', userIds).returns<UserBasic[]>(),
    supabase.from('review_comments').select('rating_id').in('rating_id', ratingIds).returns<CommentCountRow[]>(),
    supabase.from('review_likes').select('rating_id, user_id').in('rating_id', ratingIds).returns<ReviewLikeRow[]>(),
  ])

  if (flavorsResult.error) {
    console.error('[getUnifiedFeed] flavors query failed:', flavorsResult.error.message)
  }
  if (ratingUsersResult.error) {
    console.error('[getUnifiedFeed] users query failed:', ratingUsersResult.error.message)
  }
  if (commentCountsResult.error) {
    console.error('[getUnifiedFeed] comments query failed:', commentCountsResult.error.message)
  }
  if (allLikesResult.error) {
    console.error('[getUnifiedFeed] likes query failed:', allLikesResult.error.message)
  }

  const flavorMap: Record<string, FlavorWithProductForFeed> = {}
  for (const f of (flavorsResult.data ?? [])) flavorMap[f.id] = f

  const ratingUserMap: Record<string, UserBasic> = {}
  for (const u of (ratingUsersResult.data ?? [])) ratingUserMap[u.id] = u

  const commentCountMap: Record<string, number> = {}
  for (const c of (commentCountsResult.data ?? [])) {
    commentCountMap[c.rating_id] = (commentCountMap[c.rating_id] ?? 0) + 1
  }

  const likeCountMap: Record<string, number> = {}
  const likedByMe = new Set<string>()
  for (const l of (allLikesResult.data ?? [])) {
    likeCountMap[l.rating_id] = (likeCountMap[l.rating_id] ?? 0) + 1
    if (userId && l.user_id === userId) likedByMe.add(l.rating_id)
  }

  return ratings.map((r) => ({
    _type: 'rating' as const,
    id: r.id,
    overall_score: r.overall_score,
    would_buy_again: r.would_buy_again,
    review_text: r.review_text,
    photo_url: r.photo_url,
    created_at: r.created_at,
    scores: r.scores,
    context_tags: r.context_tags,
    value_score: r.value_score ?? null,
    comment_count: commentCountMap[r.id] ?? 0,
    like_count: likeCountMap[r.id] ?? 0,
    user_has_liked: likedByMe.has(r.id),
    flavor: flavorMap[r.flavor_id] ?? null,
    user: ratingUserMap[r.user_id] ?? null,
  }))
}

export async function getFollowingUnifiedFeed(userId: string, limit = 30) {
  const supabase = await createServerSupabaseClient()

  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
    .returns<FollowRow[]>()

  if (followsError) {
    console.error('[getFollowingUnifiedFeed] follows query failed:', followsError.message)
    return []
  }
  if (!follows || follows.length === 0) return []

  const followingIds = follows.map((f) => f.following_id)

  const { data: ratings, error: ratingsError } = await supabase
    .from('ratings')
    .select('id, overall_score, would_buy_again, review_text, photo_url, created_at, flavor_id, user_id, scores, context_tags, value_score')
    .in('user_id', followingIds)
    .eq('schema_version', 2)
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<FeedRatingRow[]>()

  if (ratingsError) {
    console.error('[getFollowingUnifiedFeed] ratings query failed:', ratingsError.message)
    return []
  }

  if (!ratings || ratings.length === 0) return []

  const flavorIds = ratings.map((r) => r.flavor_id)
  const userIds = ratings.map((r) => r.user_id)
  const ratingIds = ratings.map((r) => r.id)

  const [flavorsResult, ratingUsersResult, commentCountsResult, allLikesResult] = await Promise.all([
    supabase.from('flavors').select('id, name, slug, product_id, products(id, name, slug, image_url, brands(name))').in('id', flavorIds).returns<FlavorWithProductForFeed[]>(),
    supabase.from('users').select('id, username, avatar_url, badge_tier').in('id', userIds).returns<UserBasic[]>(),
    supabase.from('review_comments').select('rating_id').in('rating_id', ratingIds).returns<CommentCountRow[]>(),
    supabase.from('review_likes').select('rating_id, user_id').in('rating_id', ratingIds).returns<ReviewLikeRow[]>(),
  ])

  if (flavorsResult.error) {
    console.error('[getFollowingUnifiedFeed] flavors query failed:', flavorsResult.error.message)
  }
  if (ratingUsersResult.error) {
    console.error('[getFollowingUnifiedFeed] users query failed:', ratingUsersResult.error.message)
  }
  if (commentCountsResult.error) {
    console.error('[getFollowingUnifiedFeed] comments query failed:', commentCountsResult.error.message)
  }
  if (allLikesResult.error) {
    console.error('[getFollowingUnifiedFeed] likes query failed:', allLikesResult.error.message)
  }

  const flavorMap: Record<string, FlavorWithProductForFeed> = {}
  for (const f of (flavorsResult.data ?? [])) flavorMap[f.id] = f

  const ratingUserMap: Record<string, UserBasic> = {}
  for (const u of (ratingUsersResult.data ?? [])) ratingUserMap[u.id] = u

  const commentCountMap: Record<string, number> = {}
  for (const c of (commentCountsResult.data ?? [])) {
    commentCountMap[c.rating_id] = (commentCountMap[c.rating_id] ?? 0) + 1
  }

  const likeCountMap: Record<string, number> = {}
  const likedByMe = new Set<string>()
  for (const l of (allLikesResult.data ?? [])) {
    likeCountMap[l.rating_id] = (likeCountMap[l.rating_id] ?? 0) + 1
    if (l.user_id === userId) likedByMe.add(l.rating_id)
  }

  return ratings.map((r) => ({
    _type: 'rating' as const,
    id: r.id,
    overall_score: r.overall_score,
    would_buy_again: r.would_buy_again,
    review_text: r.review_text,
    photo_url: r.photo_url,
    created_at: r.created_at,
    scores: r.scores,
    context_tags: r.context_tags,
    value_score: r.value_score ?? null,
    comment_count: commentCountMap[r.id] ?? 0,
    like_count: likeCountMap[r.id] ?? 0,
    user_has_liked: likedByMe.has(r.id),
    flavor: flavorMap[r.flavor_id] ?? null,
    user: ratingUserMap[r.user_id] ?? null,
  }))
}
