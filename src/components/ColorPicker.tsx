import { PLAYER_COLORS } from '../utils/roomUtils'

interface Props {
  selected: string
  onChange: (color: string) => void
}

export function ColorPicker({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {PLAYER_COLORS.map(color => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={`
            aspect-square rounded-full transition-all
            ${selected === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0F0F0F] scale-110' : 'hover:scale-105 active:scale-95'}
          `}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}
