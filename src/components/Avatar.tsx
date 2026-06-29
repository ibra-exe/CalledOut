import type { CSSProperties } from 'react'

const SIZES = {
  sm: 'w-9 h-9 text-lg',
  md: 'w-12 h-12 text-2xl',
  lg: 'w-14 h-14 text-2xl',
  xl: 'w-16 h-16 text-3xl',
} as const

interface Props {
  icon?: string
  color: string
  size?: keyof typeof SIZES
  className?: string
}

// The player identity chip: emoji on a tinted disc ringed in the player's color.
// Single source so it stays pixel-consistent across lobby, voting, reveal & stats
// (previously hand-built in 4 places, with the ring present in some and not others).
export function Avatar({ icon, color, size = 'md', className = '' }: Props) {
  return (
    <div
      className={`${SIZES[size]} rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ backgroundColor: color + '33', border: `2px solid ${color}` } as CSSProperties}
    >
      <span>{icon || '🙂'}</span>
    </div>
  )
}
