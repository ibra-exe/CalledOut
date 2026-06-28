import type { Player } from '../types'

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
    sm: { avatar: 'w-9 h-9 text-lg', name: 'text-xs', card: 'gap-2 p-2' },
    md: { avatar: 'w-12 h-12 text-2xl', name: 'text-sm', card: 'gap-3 p-3' },
    lg: { avatar: 'w-16 h-16 text-3xl', name: 'text-base', card: 'gap-3 p-4' },
  }
  const s = sizes[size]

  return (
    <div className={`flex items-center ${s.card} rounded-2xl bg-[#1A1A1A] relative animate-spring-in ${isWinner ? 'ring-2 ring-[#FFE500]' : ''}`}>
      <div
        className={`${s.avatar} rounded-full flex items-center justify-center flex-shrink-0`}
        style={{ backgroundColor: player.color + '33', border: `2px solid ${player.color}` }}
      >
        <span>{player.icon || '🙂'}</span>
      </div>
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
