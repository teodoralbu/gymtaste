export const revalidate = 300

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getProductsWithFlavors } from '@/lib/queries'
import { RateLanding } from './RateLanding'

export const metadata: Metadata = {
  title: 'Rate a Flavor — GymTaste',
  description: 'Pick a supplement flavor you tried and rate it.',
}

export default async function RatePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/rate')

  const products = await getProductsWithFlavors()
  return <RateLanding products={products as any} />
}
