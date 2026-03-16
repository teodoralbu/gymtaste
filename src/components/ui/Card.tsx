import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function Card({ className = '', hover = false, children, ...props }: CardProps) {
  return (
    <div
      className={`bg-[#141414] border border-[#2A2A2A] rounded-xl ${
        hover
          ? 'hover:border-[#3A3A3A] hover:bg-[#1A1A1A] transition-colors duration-150 cursor-pointer'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
