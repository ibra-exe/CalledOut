import { useState } from 'react'
import { ref, update } from 'firebase/database'
import { db } from '../firebase'
import { getSettings, saveSettings } from '../utils/settingsUtils'
import type { AppSettings } from '../utils/settingsUtils'
import { getLang, setLang, useT } from '../i18n'
import type { Lang } from '../i18n'
import { setMusicEnabled } from '../music'
import { ProfileModal } from './ProfileModal'
import type { PlayerProfile } from '../utils/profileUtils'

interface Props {
  onClose: () => void
  // When set, the modal is being used inside a room — show "Edit Profile" and
  // sync profile edits to that player's Firebase record.
  roomCode?: string
  playerId?: string
}

export function SettingsModal({ onClose, roomCode, playerId }: Props) {
  const tr = useT()
  const [settings, setSettings] = useState<AppSettings>(getSettings)
  const [lang, setLangState] = useState<Lang>(getLang)
  const [showProfile, setShowProfile] = useState(false)

  const update_ = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
  }

  const changeLang = (next: Lang) => {
    setLangState(next)
    setLang(next)
  }

  const toggleMusic = () => {
    const next = !settings.musicEnabled
    update_({ musicEnabled: next })
    setMusicEnabled(next)
  }

  const handleProfileSave = (profile: PlayerProfile) => {
    if (roomCode && playerId) {
      update(ref(db, `rooms/${roomCode}/players/${playerId}`), {
        name: profile.name,
        icon: profile.icon,
        color: profile.color,
        font: profile.font,
      })
    }
  }

  if (showProfile) {
    return <ProfileModal onClose={() => setShowProfile(false)} onSave={handleProfileSave} />
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col justify-end animate-backdrop-in" onClick={onClose}>
      <div className="bg-[#1A1A1A] rounded-t-3xl p-4 w-full animate-sheet-in" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-6">
          <span className="text-white font-bold text-lg">{tr('settings')}</span>
          <button onClick={onClose} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* Edit profile (only inside a room) */}
        {roomCode && playerId && (
          <button
            onClick={() => setShowProfile(true)}
            className="w-full flex items-center justify-between p-4 bg-[#0F0F0F] rounded-2xl mb-3 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🙂</span>
              <p className="text-white font-semibold text-sm">{tr('yourProfile')}</p>
            </div>
            <span className="text-gray-400 text-sm">{tr('edit')} →</span>
          </button>
        )}

        {/* Language */}
        <div className="flex items-center justify-between p-4 bg-[#0F0F0F] rounded-2xl mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <div>
              <p className="text-white font-semibold text-sm">{tr('language')}</p>
              <p className="text-gray-400 text-xs">{tr('languageDesc')}</p>
            </div>
          </div>
          <div className="flex gap-1 bg-[#1A1A1A] rounded-xl p-1 flex-shrink-0">
            <button
              onClick={() => changeLang('en')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'en' ? 'bg-[#FFE500] text-[#0F0F0F]' : 'text-gray-400'}`}
            >
              EN
            </button>
            <button
              onClick={() => changeLang('ar')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'ar' ? 'bg-[#FFE500] text-[#0F0F0F]' : 'text-gray-400'}`}
            >
              عربي
            </button>
          </div>
        </div>

        {/* Sound Effects */}
        <div className="flex items-center justify-between p-4 bg-[#0F0F0F] rounded-2xl mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{settings.soundEnabled ? '🔊' : '🔇'}</span>
            <div>
              <p className="text-white font-semibold text-sm">{tr('soundEffects')}</p>
              <p className="text-gray-400 text-xs">{tr('soundDesc')}</p>
            </div>
          </div>
          <button
            onClick={() => update_({ soundEnabled: !settings.soundEnabled })}
            className={`relative w-14 h-7 rounded-full flex-shrink-0 transition-colors duration-200 ${settings.soundEnabled ? 'bg-[#FFE500]' : 'bg-white/20'}`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${settings.soundEnabled ? 'translate-x-7' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Music */}
        <div className="flex items-center justify-between p-4 bg-[#0F0F0F] rounded-2xl mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{settings.musicEnabled ? '🎵' : '🔕'}</span>
            <div>
              <p className="text-white font-semibold text-sm">{tr('music')}</p>
              <p className="text-gray-400 text-xs">{tr('musicDesc')}</p>
            </div>
          </div>
          <button
            onClick={toggleMusic}
            className={`relative w-14 h-7 rounded-full flex-shrink-0 transition-colors duration-200 ${settings.musicEnabled ? 'bg-[#FFE500]' : 'bg-white/20'}`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${settings.musicEnabled ? 'translate-x-7' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Family-friendly — hides the mature categories from game setup */}
        <div className="flex items-center justify-between p-4 bg-[#0F0F0F] rounded-2xl mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{settings.familyFriendly ? '👪' : '🌶️'}</span>
            <div>
              <p className="text-white font-semibold text-sm">{tr('familyFriendly')}</p>
              <p className="text-gray-400 text-xs">{tr('familyFriendlyDesc')}</p>
            </div>
          </div>
          <button
            onClick={() => update_({ familyFriendly: !settings.familyFriendly })}
            className={`relative w-14 h-7 rounded-full flex-shrink-0 transition-colors duration-200 ${settings.familyFriendly ? 'bg-[#FFE500]' : 'bg-white/20'}`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${settings.familyFriendly ? 'translate-x-7' : 'translate-x-0'}`}
            />
          </button>
        </div>

        <div className="h-safe-area-bottom mt-2" />
      </div>
    </div>
  )
}
