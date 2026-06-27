import { useState } from 'react'
import { getSettings, saveSettings } from '../utils/settingsUtils'
import type { AppSettings } from '../utils/settingsUtils'
import { getLang, setLang, useT } from '../i18n'
import type { Lang } from '../i18n'

interface Props {
  onClose: () => void
}

export function SettingsModal({ onClose }: Props) {
  const tr = useT()
  const [settings, setSettings] = useState<AppSettings>(getSettings)
  const [lang, setLangState] = useState<Lang>(getLang)

  const update = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
  }

  const changeLang = (next: Lang) => {
    setLangState(next)
    setLang(next)
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-[#1A1A1A] rounded-t-3xl p-4 w-full" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-6">
          <span className="text-white font-bold text-lg">{tr('settings')}</span>
          <button onClick={onClose} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* Language */}
        <div className="flex items-center justify-between p-4 bg-[#0F0F0F] rounded-2xl mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <div>
              <p className="text-white font-semibold text-sm">{tr('language')}</p>
              <p className="text-gray-500 text-xs">{tr('languageDesc')}</p>
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
              <p className="text-gray-500 text-xs">{tr('soundDesc')}</p>
            </div>
          </div>
          <button
            onClick={() => update({ soundEnabled: !settings.soundEnabled })}
            className={`relative w-14 h-7 rounded-full flex-shrink-0 transition-colors duration-200 ${settings.soundEnabled ? 'bg-[#FFE500]' : 'bg-white/20'}`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${settings.soundEnabled ? 'translate-x-7' : 'translate-x-0'}`}
            />
          </button>
        </div>

        <div className="h-safe-area-bottom mt-2" />
      </div>
    </div>
  )
}
