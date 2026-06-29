import type { Player } from '../types'
import { Avatar } from './Avatar'

interface Props {
  player: Player
  playerId?: string
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  votes?: number
  isWinner?: boolean
  onKick?: () => void
}

export function PlayerCard({ player, size = 'md', showName = true, votes, isWinner, onKick }: Props) {
  const sizes = {
    sm: { name: 'text-xs', card: 'gap-2 p-2' },
    md: { name: 'text-sm', card: 'gap-3 p-3' },
    lg: { name: 'text-base', card: 'gap-3 p-4' },
  }
  const s = sizes[size]
  const avatarSize = size === 'lg' ? 'xl' : size // PlayerCard lg = w-16 (Avatar xl)

  return (
    <div className={`flex items-center ${s.card} rounded-2xl bg-[#1A1A1A] relative animate-spring-in ${isWinner ? 'ring-2 ring-[#FFE500]' : ''}`}>
      <Avatar icon={player.icon} color={player.color} size={avatarSize} />
      {showName && (
        <div className="flex-1 min-w-0">
          <p className={`${s.name} font-semibold text-white truncate ${player.font}`}>
            {player.name || 'Unnamed'}
          </p>
          {votes !== undefined && (
            <p className="text-xs text-gray-400">{votes} vote{votes !== 1 ? 's' : ''}</p>
          )}
        </div>
      )}
      {isWinner && <span className="text-[#FFE500] text-lg ml-auto">⭐</span>}
      {onKick && (
        <button
          onClick={onKick}
          className="ml-auto w-7 h-7 rounded-full bg-[#FF4D4D]/20 text-[#FF4D4D] flex items-center justify-center text-sm font-bold hover:bg-[#FF4D4D]/40 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  )
}
