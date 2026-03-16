'use client'

interface SliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 0.5,
  className = '',
}: SliderProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="text-sm font-bold text-[#00B4FF] tabular-nums w-8 text-right">
          {value.toFixed(1)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-[#444]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
