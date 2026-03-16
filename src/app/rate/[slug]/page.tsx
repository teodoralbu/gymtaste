import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { RatingForm } from '@/components/rating/RatingForm'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function RatePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: flavor } = await db
    .from('flavors')
    .select('id, name, slug, products(id, name, slug, brands(name)), flavor_tag_assignments(flavor_tags(id, name, slug))')
    .eq('slug', slug)
    .single()

  if (!flavor) notFound()

  const flavorData = {
    id: flavor.id as string,
    name: flavor.name as string,
    slug: flavor.slug as string,
    product: {
      id: flavor.products.id as string,
      name: flavor.products.name as string,
      slug: flavor.products.slug as string,
      brand: { name: flavor.products.brands?.name as string },
    },
    tags: (flavor.flavor_tag_assignments as any[])
      ?.map((a: any) => a.flavor_tags)
      .filter(Boolean) ?? [],
  }

  return <RatingForm flavor={flavorData} />
}
