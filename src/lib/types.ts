// ─── Enums ────────────────────────────────────────────────────────────────────

export type BadgeTier = 'fresh_meat' | 'first_rep' | 'taster' | 'consistent' | 'flavor_hunter' | 'supplement_scholar' | 'connoisseur' | 'elite_palate' | 'gym_rat' | 'legend'
export type ReportReason = 'false_info' | 'spam' | 'offensive' | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

// ─── Database Row Types ────────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  is_active: boolean
  created_at: string
}

export interface CategoryRatingDimension {
  id: string
  category_id: string
  name: string
  weight: number
  display_order: number
  created_at: string
}

export interface User {
  id: string
  username: string
  email: string
  avatar_url: string | null
  bio: string | null
  badge_tier: BadgeTier
  created_at: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
}

export interface Product {
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
}

export interface Flavor {
  id: string
  product_id: string
  name: string
  slug: string
  created_at: string
}

export interface FlavorTag {
  id: string
  name: string
  slug: string
}

export interface FlavorTagAssignment {
  flavor_id: string
  tag_id: string
}

export interface Rating {
  id: string
  user_id: string
  flavor_id: string
  scores: Record<string, number>
  overall_score: number
  would_buy_again: boolean
  context_tags: string[]
  review_text: string | null
  created_at: string
}

export interface ReviewLike {
  user_id: string
  rating_id: string
  created_at: string
}

export interface ReviewComment {
  id: string
  rating_id: string
  user_id: string
  text: string
  created_at: string
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  rating_id: string
  reason: ReportReason
  description: string | null
  status: ReportStatus
  created_at: string
}

export interface ProductSubmission {
  id: string
  user_id: string
  brand_name: string
  product_name: string
  flavor_name: string
  barcode: string | null
  image_url: string | null
  status: SubmissionStatus
  created_at: string
}

// ─── Enriched / Joined Types ──────────────────────────────────────────────────

export interface FlavorWithProduct extends Flavor {
  product: Product & {
    brand: Brand
  }
  tags: FlavorTag[]
  avg_overall_score: number | null
  rating_count: number
  would_buy_again_pct: number | null
}

export interface RatingWithUser extends Rating {
  user: User
  like_count: number
  comment_count: number
  user_has_liked?: boolean
}

export interface RatingWithFlavor extends Rating {
  flavor: Flavor & {
    product: Product & {
      brand: Brand
    }
  }
}

export interface ProductWithBrand extends Product {
  brand: Brand
  flavors: FlavorWithProduct[]
}

export interface UserWithStats extends User {
  total_ratings: number
  following_count: number
  follower_count: number
  likes_received: number
}

export interface LeaderboardEntry {
  flavor: FlavorWithProduct
  rank: number
}

// ─── Supabase Database type (for createClient generic) ───────────────────────

export type Database = {
  public: {
    Tables: {
      categories: { Row: Category; Insert: Omit<Category, 'id' | 'created_at'>; Update: Partial<Category> }
      category_rating_dimensions: { Row: CategoryRatingDimension; Insert: Omit<CategoryRatingDimension, 'id' | 'created_at'>; Update: Partial<CategoryRatingDimension> }
      users: { Row: User; Insert: Omit<User, 'created_at'>; Update: Partial<User> }
      brands: { Row: Brand; Insert: Omit<Brand, 'id' | 'created_at'>; Update: Partial<Brand> }
      products: { Row: Product; Insert: Omit<Product, 'id' | 'created_at'>; Update: Partial<Product> }
      flavors: { Row: Flavor; Insert: Omit<Flavor, 'id' | 'created_at'>; Update: Partial<Flavor> }
      flavor_tags: { Row: FlavorTag; Insert: Omit<FlavorTag, 'id'>; Update: Partial<FlavorTag> }
      flavor_tag_assignments: { Row: FlavorTagAssignment; Insert: FlavorTagAssignment; Update: Partial<FlavorTagAssignment> }
      ratings: { Row: Rating; Insert: Omit<Rating, 'id' | 'created_at'>; Update: Partial<Rating> }
      review_likes: { Row: ReviewLike; Insert: Omit<ReviewLike, 'created_at'>; Update: Partial<ReviewLike> }
      review_comments: { Row: ReviewComment; Insert: Omit<ReviewComment, 'id' | 'created_at'>; Update: Partial<ReviewComment> }
      follows: { Row: Follow; Insert: Omit<Follow, 'created_at'>; Update: Partial<Follow> }
      reports: { Row: Report; Insert: Omit<Report, 'id' | 'created_at'>; Update: Partial<Report> }
      product_submissions: { Row: ProductSubmission; Insert: Omit<ProductSubmission, 'id' | 'created_at'>; Update: Partial<ProductSubmission> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      badge_tier_enum: BadgeTier
      report_reason_enum: ReportReason
      report_status_enum: ReportStatus
      submission_status_enum: SubmissionStatus
    }
  }
}
