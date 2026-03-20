import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { RatingForm } from '@/components/rating/RatingForm'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function RatePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/rate/${slug}`)
  interface RatePageFlavor {
    id: string
    name: string
    slug: string
    products: {
      id: string
      name: string
      slug: string
      brands: { name: string } | null
    }
    flavor_tag_assignments: { flavor_tags: { id: string; name: string; slug: string } }[]
  }

  const { data: flavor, error: flavorError } = await supabase
    .from('flavors')
    .select('id, name, slug, products(id, name, slug, brands(name)), flavor_tag_assignments(flavor_tags(id, name, slug))')
    .eq('slug', slug)
    .returns<RatePageFlavor[]>()
    .single()

  if (flavorError) {
    console.error('[RatePage] flavor query failed:', flavorError.message)
  }

  if (!flavor) notFound()

  const flavorData = {
    id: flavor.id,
    name: flavor.name,
    slug: flavor.slug,
    product: {
      id: flavor.products.id,
      name: flavor.products.name,
      slug: flavor.products.slug,
      brand: { name: flavor.products.brands?.name ?? '' },
    },
    tags: flavor.flavor_tag_assignments
      ?.map((a) => a.flavor_tags)
      .filter(Boolean) ?? [],
  }

  return <RatingForm flavor={flavorData} />
}
