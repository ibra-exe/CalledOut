import type { Player } from '../types'
import { Avatar } from './Avatar'
import { useT } from '../i18n'

interface Props {
  player: Player
  playerId: string
  isSelected: boolean
  disabled: boolean
  isSelf: boolean
  onClick: () => void
}

export function VoteButton({ player, isSelected, disabled, isSelf, onClick }: Props) {
  const tr = useT()
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 min-h-[56px] text-left
        ${isSelected
          ? 'border-[#FFE500] bg-[#FFE500]/10 scale-[0.98]'
          : disabled
            ? 'border-transparent bg-[#1A1A1A]/40 opacity-40 cursor-not-allowed'
            : 'border-transparent bg-[#1A1A1A] hover:border-white/20 active:scale-[0.98]'
        }
      `}
    >
      <Avatar icon={player.icon} color={player.color} size="md" />
      <span className={`font-semibold text-white flex-1 truncate ${player.font}`}>
        {player.name}{isSelf ? ` ${tr('you')}` : ''}
      </span>
      {isSelected && (
        <span className="text-[#FFE500] text-xl flex-shrink-0">✓</span>
      )}
    </button>
  )
}
