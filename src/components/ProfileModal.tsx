import { useState } from 'react'
import { EmojiPicker } from './EmojiPicker'
import { ColorPicker } from './ColorPicker'
import { FontPicker } from './FontPicker'
import { getSavedProfile, saveProfileLocally } from '../utils/profileUtils'
import type { PlayerProfile } from '../utils/profileUtils'

interface Props {
  onClose: () => void
  onSave?: (profile: PlayerProfile) => void
}

export function ProfileModal({ onClose, onSave }: Props) {
  const saved = getSavedProfile()
  const [name, setName] = useState(saved.name)
  const [icon, setIcon] = useState(saved.icon)
  const [color, setColor] = useState(saved.color)
  const [font, setFont] = useState(saved.font)
  const [tab, setTab] = useState<'icon' | 'color' | 'font'>('icon')

  const handleSave = () => {
    if (!name.trim()) return
    const profile: PlayerProfile = { name: name.trim(), icon, color, font }
    saveProfileLocally(profile)
    onSave?.(profile)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-[#1A1A1A] rounded-t-3xl p-4 w-full" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <span className="text-white font-bold text-lg">Your Profile</span>
          <button onClick={onClose} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        <div className="flex items-center gap-3 mb-3 p-3 bg-[#0F0F0F] rounded-xl">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: color + '33' }}
          >
            {icon}
          </div>
          <span className={`text-white font-semibold truncate ${font}`}>{name || 'Your name'}</span>
        </div>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value.slice(0, 20))}
          placeholder="Your name..."
          className="w-full py-3 px-4 bg-[#0F0F0F] rounded-xl text-white font-semibold border-2 border-transparent focus:border-[#FFE500] outline-none placeholder-gray-600 mb-3"
          maxLength={20}
        />

        <div className="flex gap-1 mb-3 bg-[#0F0F0F] rounded-xl p-1">
          {(['icon', 'color', 'font'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-[#1A1A1A] text-white' : 'text-gray-500'}`}
            >
              {t === 'icon' ? '😀 Icon' : t === 'color' ? '🎨 Color' : '🅰 Font'}
            </button>
          ))}
        </div>

        {tab === 'icon' && <EmojiPicker selected={icon} onChange={setIcon} />}
        {tab === 'color' && <ColorPicker selected={color} onChange={setColor} />}
        {tab === 'font' && <FontPicker selected={font} onChange={setFont} />}

        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="mt-4 w-full py-3 rounded-xl bg-[#FFE500] text-[#0F0F0F] font-black text-sm hover:bg-yellow-300 active:scale-[0.98] transition-all disabled:opacity-40"
        >
          Save Profile
        </button>
      </div>
    </div>
  )
}
