'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { updateProductImage } from '@/app/admin/products/actions'

interface Product {
  id: string
  name: string
  slug: string
  image_url: string | null
  brands: { name: string }
}

interface Props {
  products: Product[]
}

export function AdminProductImages({ products }: Props) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>(
    Object.fromEntries(products.map((p) => [p.id, p.image_url ?? '']))
  )
  const [uploading, setUploading] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const supabase = createClient()

  async function handleFileUpload(productId: string, file: File) {
    setUploading(productId)
    setError(null)

    const ext = file.name.split('.').pop()
    const path = `products/${productId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`)
      setUploading(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(path)

    const { error: updateError } = await updateProductImage(productId, publicUrl)

    if (updateError) {
      setError(`Save failed: ${updateError}`)
      setUploading(null)
      return
    }

    setImageUrls((prev) => ({ ...prev, [productId]: publicUrl }))
    setSaved(productId)
    setTimeout(() => setSaved(null), 2000)
    setUploading(null)
  }

  return (
    <div>
      {error && (
        <div style={{ color: '#FF3D00', fontSize: '14px', marginBottom: '20px', padding: '12px 16px', backgroundColor: '#FF3D0014', borderRadius: '8px', border: '1px solid #FF3D0033' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {products.map((product) => {
          const currentUrl = imageUrls[product.id]
          const isUploading = uploading === product.id
          const isSaved = saved === product.id

          return (
            <div key={product.id} style={{
              backgroundColor: '#141414', border: '1px solid #2A2A2A',
              borderRadius: '12px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              {/* Thumbnail */}
              <div style={{
                width: '56px', height: '56px', borderRadius: '8px',
                backgroundColor: '#1E1E1E', border: '1px solid #2A2A2A',
                flexShrink: 0, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {currentUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUrl}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: '22px' }}>📦</span>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>{product.name}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{product.brands?.name}</div>
              </div>

              {/* Upload button */}
              <div style={{ flexShrink: 0 }}>
                <input
                  ref={(el) => { fileInputRefs.current[product.id] = el }}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(product.id, file)
                  }}
                />
                <button
                  onClick={() => fileInputRefs.current[product.id]?.click()}
                  disabled={isUploading}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    border: isSaved ? '1px solid #00E676' : '1px solid #2A2A2A',
                    backgroundColor: isSaved ? '#00E67614' : '#1E1E1E',
                    color: isSaved ? '#00E676' : isUploading ? '#555' : '#A0A0A0',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isUploading ? 'Uploading…' : isSaved ? '✓ Saved' : currentUrl ? 'Replace image' : 'Upload image'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
