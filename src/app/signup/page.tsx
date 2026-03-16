'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SignupPage() {
  const { signUp } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', username: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isSupabaseConfigured()) {
      return setError('Supabase is not configured. Add your credentials to .env.local to enable auth.')
    }
    if (form.username.length < 3) return setError('Username must be at least 3 characters.')
    if (!/^[a-z0-9_]+$/.test(form.username))
      return setError('Username can only contain lowercase letters, numbers, and underscores.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')

    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.username)
    setLoading(false)

    if (error) {
      setError(error)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-bold mb-2">Check your email</h2>
          <p className="text-[#A0A0A0] text-sm leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="text-white font-medium">{form.email}</span>. Click it to activate your
            account.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-sm text-[#00B4FF] hover:underline"
          >
            Back to log in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black">Join GYMTASTE</h1>
          <p className="text-[#A0A0A0] text-sm mt-2">Rate supplements. Build your rep.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Username"
            type="text"
            placeholder="yourname"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
            hint="Lowercase letters, numbers, underscores only"
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete="new-password"
          />

          {error && (
            <p className="text-sm text-[#FF3D00] bg-[#FF3D0014] border border-[#FF3D0033] rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-[#666] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#00B4FF] hover:underline font-medium">
            Log in
          </Link>
        </p>
        <p className="text-center text-xs text-[#444] mt-4 leading-relaxed">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-[#666] hover:text-[#A0A0A0]">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-[#666] hover:text-[#A0A0A0]">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
