import { FONT_OPTIONS } from '../utils/roomUtils'

interface Props {
  selected: string
  onChange: (font: string) => void
}

export function FontPicker({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {FONT_OPTIONS.map(f => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`
            py-3 px-3 rounded-xl border-2 text-sm transition-all truncate
            ${f.id === 'font-press-start' ? 'text-xs' : 'text-sm'}
            ${selected === f.id
              ? 'border-[#FFE500] bg-[#FFE500]/10 text-[#FFE500]'
              : 'border-white/10 bg-[#0F0F0F] text-gray-300 hover:border-white/20'
            }
            ${f.id}
          `}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
