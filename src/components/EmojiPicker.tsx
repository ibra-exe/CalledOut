import { PLAYER_EMOJIS } from '../utils/roomUtils'

interface Props {
  selected: string
  onChange: (emoji: string) => void
}

export function EmojiPicker({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {PLAYER_EMOJIS.map(emoji => (
        <button
          key={emoji}
          onClick={() => onChange(emoji)}
          className={`
            h-11 w-full rounded-xl text-2xl flex items-center justify-center transition-all
            ${selected === emoji
              ? 'bg-[#FFE500]/20 ring-2 ring-[#FFE500] scale-110'
              : 'bg-[#1A1A1A] hover:bg-white/10 active:scale-95'
            }
          `}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
