interface PillProps {
  label: string
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function Pill({ label, selected = false, onClick, className = '' }: PillProps) {
  const base =
    'inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border transition-colors duration-150'
  const styles = selected
    ? 'bg-[#00B4FF14] border-[#00B4FF44] text-[#00B4FF]'
    : 'bg-[#1E1E1E] border-[#2A2A2A] text-[#A0A0A0]'
  const interactive = onClick ? 'cursor-pointer hover:border-[#3A3A3A] hover:text-white' : ''

  return (
    <span
      className={`${base} ${styles} ${interactive} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {label}
    </span>
  )
}
