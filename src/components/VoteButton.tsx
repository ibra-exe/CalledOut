import type { Player } from '../types'

interface Props {
  player: Player
  playerId: string
  hasVoted: boolean
  isSelected: boolean
  disabled: boolean
  isSelf: boolean
  onClick: () => void
}

export function VoteButton({ player, hasVoted, isSelected, disabled, isSelf, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 min-h-[56px] text-left
        ${isSelected
          ? 'border-[#FFE500] bg-[#FFE500]/10 scale-[0.98]'
          : hasVoted
            ? 'border-white/10 bg-[#1A1A1A]/50 opacity-50'
            : disabled
              ? 'border-transparent bg-[#1A1A1A]/40 opacity-40 cursor-not-allowed'
              : 'border-transparent bg-[#1A1A1A] hover:border-white/20 active:scale-[0.98]'
        }
      `}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: player.color + '33', border: `2px solid ${player.color}` }}
      >
        {player.icon}
      </div>
      <span className={`font-semibold text-white flex-1 truncate ${player.font}`}>
        {player.name}{isSelf ? ' (you)' : ''}
      </span>
      {isSelected && (
        <span className="text-[#FFE500] text-xl flex-shrink-0">✓</span>
      )}
    </button>
  )
}
