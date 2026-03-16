'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'

export default function SubmitPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    brand_name: '',
    product_name: '',
    flavor_name: '',
    barcode: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    if (!form.brand_name.trim() || !form.product_name.trim() || !form.flavor_name.trim()) {
      setError('Brand, product and flavor name are required.')
      return
    }

    setSubmitting(true)
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    const { error: insertError } = await db.from('product_submissions').insert({
      user_id: user.id,
      brand_name: form.brand_name.trim(),
      product_name: form.product_name.trim(),
      flavor_name: form.flavor_name.trim(),
      barcode: form.barcode.trim() || null,
      status: 'pending',
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    setDone(true)
    setSubmitting(false)
  }

  if (done) {
    return (
      <div style={{
        maxWidth: '520px',
        margin: '0 auto',
        padding: '96px 24px 80px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-elevated)',
          border: '2px solid var(--green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{
          fontSize: '26px',
          fontWeight: 900,
          color: 'var(--text)',
          marginBottom: '12px',
          letterSpacing: '-0.02em',
        }}>
          Submission received
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '15px',
          lineHeight: 1.7,
          marginBottom: '40px',
          maxWidth: '360px',
          margin: '0 auto 40px',
        }}>
          We&apos;ll review your submission and add it to the catalog soon. Thanks for contributing.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setDone(false)
              setForm({ brand_name: '', product_name: '', flavor_name: '', barcode: '' })
            }}
            className="btn btn-secondary"
          >
            Submit another
          </button>
          <button
            onClick={() => router.push('/browse')}
            className="btn btn-primary"
          >
            Browse products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '56px 24px 96px' }}>

      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{
          display: 'inline-block',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--accent)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '16px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent-dim)',
          border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
        }}>
          Community
        </div>
        <h1 style={{
          fontSize: 'clamp(26px, 5vw, 34px)',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: 'var(--text)',
          margin: '0 0 12px',
          lineHeight: 1.1,
        }}>
          Submit a product
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '15px',
          margin: 0,
          lineHeight: 1.65,
        }}>
          Can&apos;t find a product? Submit it and we&apos;ll add it to the catalog.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Brand */}
        <div>
          <label style={labelStyle}>
            Brand name <span style={{ color: 'var(--red)', fontWeight: 400 }}>*</span>
          </label>
          <input
            type="text"
            value={form.brand_name}
            onChange={(e) => set('brand_name', e.target.value)}
            placeholder="e.g. Ghost, Transparent Labs"
            className="input"
            style={inputStyle}
          />
        </div>

        {/* Product */}
        <div>
          <label style={labelStyle}>
            Product name <span style={{ color: 'var(--red)', fontWeight: 400 }}>*</span>
          </label>
          <input
            type="text"
            value={form.product_name}
            onChange={(e) => set('product_name', e.target.value)}
            placeholder="e.g. GHOST Legend, BULK Pre-Workout"
            className="input"
            style={inputStyle}
          />
        </div>

        {/* Flavor */}
        <div>
          <label style={labelStyle}>
            Flavor <span style={{ color: 'var(--red)', fontWeight: 400 }}>*</span>
          </label>
          <input
            type="text"
            value={form.flavor_name}
            onChange={(e) => set('flavor_name', e.target.value)}
            placeholder="e.g. Mango Peach, Blue Raspberry"
            className="input"
            style={inputStyle}
          />
        </div>

        {/* Barcode */}
        <div>
          <label style={labelStyle}>
            Barcode{' '}
            <span style={{ color: 'var(--text-faint)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              — optional
            </span>
          </label>
          <input
            type="text"
            value={form.barcode}
            onChange={(e) => set('barcode', e.target.value)}
            placeholder="Scan or type the barcode"
            className="input"
            style={inputStyle}
          />
          <p style={{
            marginTop: '6px',
            fontSize: '12px',
            color: 'var(--text-faint)',
            lineHeight: 1.5,
          }}>
            Helps us match your submission to existing products.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            color: 'var(--red)',
            fontSize: '14px',
            padding: '12px 16px',
            backgroundColor: 'color-mix(in srgb, var(--red) 8%, transparent)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid color-mix(in srgb, var(--red) 25%, transparent)',
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary"
          style={{
            padding: '15px',
            fontSize: '15px',
            fontWeight: 800,
            borderRadius: 'var(--radius-md)',
            opacity: submitting ? 0.55 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
            letterSpacing: '0.01em',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>

        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-faint)',
          lineHeight: 1.6,
          margin: 0,
        }}>
          Submissions are reviewed before going live. We&apos;ll add it within 24–48 hours.
        </p>
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--text-dim)',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
}
