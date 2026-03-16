'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function updateProductImage(productId: string, imageUrl: string) {
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { error } = await db
    .from('products')
    .update({ image_url: imageUrl })
    .eq('id', productId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}
