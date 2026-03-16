export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AdminProductImages } from '@/components/admin/AdminProductImages'

export default async function AdminProductsPage() {
  const supabase = await createServerSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: products } = await db
    .from('products')
    .select('id, name, slug, image_url, brands(name)')
    .eq('is_approved', true)
    .order('name')

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 80px' }}>
      <div style={{ marginBottom: '40px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#FF9100', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Admin
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0 }}>Product Images</h1>
      </div>
      <AdminProductImages products={(products ?? []) as any[]} />
    </div>
  )
}
