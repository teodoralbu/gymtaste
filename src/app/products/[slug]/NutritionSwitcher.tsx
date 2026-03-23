'use client'

import { useState } from 'react'

interface NutritionSwitcherProps {
  calories: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  sugarG: number | null
  sodiumMg: number | null
  scoopWeightG: number | null
  servingWeightG: number | null
}

type Unit = 'scoop' | 'serving' | '100g'

const UNIT_LABELS: Record<Unit, string> = {
  scoop: 'Per scoop',
  serving: 'Per serving',
  '100g': 'Per 100g',
}

export function NutritionSwitcher({
  calories,
  proteinG,
  carbsG,
  fatG,
  sugarG,
  sodiumMg,
  scoopWeightG,
  servingWeightG,
}: NutritionSwitcherProps) {
  const [activeUnit, setActiveUnit] = useState<Unit>('serving')

  const nutrients = [
    { label: 'Calories', value: calories, unit: '', decimals: 0 },
    { label: 'Protein', value: proteinG, unit: 'g', decimals: 1 },
    { label: 'Carbs', value: carbsG, unit: 'g', decimals: 1 },
    { label: 'Fat', value: fatG, unit: 'g', decimals: 1 },
    { label: 'Sugar', value: sugarG, unit: 'g', decimals: 1 },
    { label: 'Sodium', value: sodiumMg, unit: 'mg', decimals: 0 },
  ].filter((n) => n.value != null && !isNaN(Number(n.value))) as { label: string; value: number; unit: string; decimals: number }[]

  if (nutrients.length === 0) return null

  // Build available units
  const availableUnits: Unit[] = []
  const hasScoopAndServing =
    scoopWeightG != null && scoopWeightG > 0 && servingWeightG != null && servingWeightG > 0
  const hasServing = servingWeightG != null && servingWeightG > 0

  if (hasScoopAndServing) availableUnits.push('scoop')
  availableUnits.push('serving')
  if (hasServing) availableUnits.push('100g')

  function getMultiplier(unit: Unit): number {
    if (unit === 'serving') return 1
    if (unit === 'scoop') {
      if (!scoopWeightG || !servingWeightG || servingWeightG === 0) return 1
      return scoopWeightG / servingWeightG
    }
    // 100g
    if (!servingWeightG || servingWeightG === 0) return 1
    return 100 / servingWeightG
  }

  const multiplier = getMultiplier(activeUnit)

  return (
    <div>
      <h2
        style={{
          fontSize: '16px',
          fontWeight: 800,
          marginBottom: '14px',
          color: 'var(--text)',
          letterSpacing: '-0.01em',
        }}
      >
        Nutrition Facts
      </h2>

      {availableUnits.length > 1 && (
        <div className="m-segment" style={{ marginBottom: '16px' }}>
          {availableUnits.map((unit) => (
            <button
              key={unit}
              className={`m-segment-tab${activeUnit === unit ? ' active' : ''}`}
              onClick={() => setActiveUnit(unit)}
            >
              {UNIT_LABELS[unit]}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
        }}
      >
        {nutrients.map((n) => (
          <div
            key={n.label}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text)',
              }}
            >
              {(n.value * multiplier).toFixed(n.decimals)}
              {n.unit}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
                marginTop: '4px',
              }}
            >
              {n.label}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 480px) {
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}
