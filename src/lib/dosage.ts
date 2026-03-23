import type { FitnessGoal } from './types'

/**
 * Dosage calculation logic based on ISSN (International Society of Sports Nutrition)
 * position stands and published safe ranges.
 *
 * IMPORTANT: These are general guidance ranges, not medical advice.
 * Users should consult a healthcare professional before supplementing.
 */

export interface DosageRange {
  ingredient: string
  minDose: number
  maxDose: number
  unit: string
  perServing: number | null
  servingUnit: string
  minServings: number | null
  maxServings: number | null
  citation: string
}

interface DosageInput {
  weightKg: number
  fitnessGoal: FitnessGoal
  caffeineMg: number | null
  citrullineG: number | null
  betaAlanineG: number | null
}

/**
 * Caffeine: ISSN recommends 3-6 mg/kg body weight for ergogenic effects.
 * Endurance athletes benefit from the higher end (5-6 mg/kg).
 * Fat loss goals use moderate range (3-5 mg/kg).
 * Muscle gain uses lower-moderate range (3-4 mg/kg) since caffeine
 * is less critical for hypertrophy.
 */
function getCaffeineRange(weightKg: number, goal: FitnessGoal): { min: number; max: number } {
  switch (goal) {
    case 'endurance':
      return { min: Math.round(weightKg * 3), max: Math.round(weightKg * 6) }
    case 'fat_loss':
      return { min: Math.round(weightKg * 3), max: Math.round(weightKg * 5) }
    case 'muscle_gain':
    default:
      return { min: Math.round(weightKg * 3), max: Math.round(weightKg * 4) }
  }
}

/**
 * Citrulline: ISSN recommends 6-8g/day of L-citrulline for performance.
 * Muscle gain benefits from higher doses for blood flow/pump.
 * Endurance benefits from moderate doses.
 */
function getCitrullineRange(goal: FitnessGoal): { min: number; max: number } {
  switch (goal) {
    case 'muscle_gain':
      return { min: 6, max: 8 }
    case 'endurance':
      return { min: 6, max: 8 }
    case 'fat_loss':
    default:
      return { min: 6, max: 8 }
  }
}

/**
 * Beta-Alanine: ISSN recommends 3.2-6.4g/day for carnosine loading.
 * Endurance athletes benefit most from higher doses.
 */
function getBetaAlanineRange(goal: FitnessGoal): { min: number; max: number } {
  switch (goal) {
    case 'endurance':
      return { min: 4, max: 6.4 }
    case 'muscle_gain':
      return { min: 3.2, max: 6.4 }
    case 'fat_loss':
    default:
      return { min: 3.2, max: 4.8 }
  }
}

function calcServingRange(
  minDose: number,
  maxDose: number,
  perServing: number
): { min: number; max: number } {
  return {
    min: Math.round((minDose / perServing) * 10) / 10,
    max: Math.round((maxDose / perServing) * 10) / 10,
  }
}

export function calculateDosageRanges(input: DosageInput): DosageRange[] {
  const ranges: DosageRange[] = []

  if (input.caffeineMg != null && input.caffeineMg > 0) {
    const caffeineRange = getCaffeineRange(input.weightKg, input.fitnessGoal)
    const servings = calcServingRange(caffeineRange.min, caffeineRange.max, input.caffeineMg)
    ranges.push({
      ingredient: 'Caffeine',
      minDose: caffeineRange.min,
      maxDose: caffeineRange.max,
      unit: 'mg',
      perServing: input.caffeineMg,
      servingUnit: 'mg/serving',
      minServings: servings.min,
      maxServings: servings.max,
      citation: 'ISSN Position Stand: 3-6 mg/kg body weight (Goldstein et al., 2010)',
    })
  }

  if (input.citrullineG != null && input.citrullineG > 0) {
    const citRange = getCitrullineRange(input.fitnessGoal)
    const servings = calcServingRange(citRange.min, citRange.max, input.citrullineG)
    ranges.push({
      ingredient: 'Citrulline',
      minDose: citRange.min,
      maxDose: citRange.max,
      unit: 'g',
      perServing: input.citrullineG,
      servingUnit: 'g/serving',
      minServings: servings.min,
      maxServings: servings.max,
      citation: 'ISSN Position Stand: 6-8 g/day L-citrulline (Trexler et al., 2019)',
    })
  }

  if (input.betaAlanineG != null && input.betaAlanineG > 0) {
    const baRange = getBetaAlanineRange(input.fitnessGoal)
    const servings = calcServingRange(baRange.min, baRange.max, input.betaAlanineG)
    ranges.push({
      ingredient: 'Beta-Alanine',
      minDose: baRange.min,
      maxDose: baRange.max,
      unit: 'g',
      perServing: input.betaAlanineG,
      servingUnit: 'g/serving',
      minServings: servings.min,
      maxServings: servings.max,
      citation: 'ISSN Position Stand: 3.2-6.4 g/day (Trexler et al., 2015)',
    })
  }

  return ranges
}

export const SAFETY_DISCLAIMER =
  'These dosage ranges are based on published ISSN (International Society of Sports Nutrition) position stands and are intended as general guidance only. They are not medical advice. Individual tolerance varies. Consult a healthcare professional before starting any supplement regimen, especially if you have pre-existing conditions or are taking medication. Do not exceed the manufacturer\'s recommended dose without professional guidance.'
