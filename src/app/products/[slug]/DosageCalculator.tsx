'use client'

import { useAuth } from '@/context/auth-context'
import { calculateDosageRanges, SAFETY_DISCLAIMER } from '@/lib/dosage'
import { FITNESS_GOALS } from '@/lib/constants'
import type { FitnessGoal } from '@/lib/types'
import Link from 'next/link'

interface DosageCalculatorProps {
  caffeineMg: number | null
  citrullineG: number | null
  betaAlanineG: number | null
}

export function DosageCalculator({ caffeineMg, citrullineG, betaAlanineG }: DosageCalculatorProps) {
  const { profile, user } = useAuth()

  // Don't render if product has no dosage-relevant ingredients
  const hasIngredients = (caffeineMg != null && caffeineMg > 0)
    || (citrullineG != null && citrullineG > 0)
    || (betaAlanineG != null && betaAlanineG > 0)

  if (!hasIngredients) return null

  // Not logged in
  if (!user) {
    return (
      <div
        className="card"
        style={{ padding: '20px', marginBottom: '24px' }}
      >
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '8px',
          }}
        >
          Dosage Calculator
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Log in
          </Link>{' '}
          to get personalized dosage recommendations based on your body stats.
        </p>
      </div>
    )
  }

  // Logged in but missing body stats
  if (!profile?.weight_kg || !profile?.fitness_goal) {
    return (
      <div
        className="card"
        style={{ padding: '20px', marginBottom: '24px' }}
      >
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '8px',
          }}
        >
          Dosage Calculator
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          <Link href="/settings" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Set up your body stats
          </Link>{' '}
          (weight and fitness goal) in settings to get personalized dosage recommendations.
        </p>
      </div>
    )
  }

  const goalLabel = FITNESS_GOALS.find((g) => g.value === profile.fitness_goal)?.label ?? profile.fitness_goal

  const ranges = calculateDosageRanges({
    weightKg: profile.weight_kg,
    fitnessGoal: profile.fitness_goal as FitnessGoal,
    caffeineMg,
    citrullineG,
    betaAlanineG,
  })

  if (ranges.length === 0) return null

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        Dosage Calculator
        <span
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--text-faint)',
            textTransform: 'none',
          }}
        >
          for {profile.weight_kg}kg / {goalLabel}
        </span>
      </h3>

      <div
        className="card"
        style={{
          padding: '0',
          overflow: 'hidden',
        }}
      >
        {ranges.map((range, i) => (
          <div
            key={range.ingredient}
            style={{
              padding: '16px 20px',
              borderBottom: i < ranges.length - 1 ? '1px solid var(--border-soft)' : 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--text)',
                }}
              >
                {range.ingredient}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--accent)',
                }}
              >
                {range.minDose}-{range.maxDose} {range.unit}
              </span>
            </div>

            {range.perServing != null && range.minServings != null && range.maxServings != null && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                }}
              >
                This product: {range.perServing} {range.servingUnit} — take{' '}
                <strong style={{ color: 'var(--text)' }}>
                  {range.minServings === range.maxServings
                    ? `${range.minServings} serving${range.minServings !== 1 ? 's' : ''}`
                    : `${range.minServings}-${range.maxServings} servings`}
                </strong>
              </div>
            )}

            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-faint)',
                fontStyle: 'italic',
              }}
            >
              {range.citation}
            </div>
          </div>
        ))}

        {/* Non-dismissable safety disclaimer */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: 'var(--bg-elevated)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#FFD600',
              marginBottom: '6px',
            }}
          >
            Safety Disclaimer
          </div>
          <p
            style={{
              fontSize: '11px',
              lineHeight: 1.5,
              color: 'var(--text-muted)',
              margin: 0,
            }}
          >
            {SAFETY_DISCLAIMER}
          </p>
        </div>
      </div>
    </div>
  )
}
