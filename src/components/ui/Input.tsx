import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-white">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-4 py-2.5 rounded-lg bg-[#141414] border ${
            error ? 'border-[#FF3D00]' : 'border-[#2A2A2A]'
          } text-white placeholder-[#555] text-base outline-none focus:border-[#00B4FF] transition-colors duration-150 ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-[#FF3D00]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#555]">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
