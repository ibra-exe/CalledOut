import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSavedProfile } from '../utils/profileUtils'
import type { PlayerProfile } from '../utils/profileUtils'
import { ProfileModal } from '../components/ProfileModal'
import { SettingsModal } from '../components/SettingsModal'
import { AmbientBackground } from '../components/AmbientBackground'
import { useT } from '../i18n'

function AlienIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M10 1C17 1 19 7 19 12C19 18.5 11.5 25 10 25C8.5 25 1 18.5 1 12C1 7 3 1 10 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="6.5" cy="13" rx="3.2" ry="1.9" transform="rotate(22 6.5 13)" fill="currentColor" />
      <ellipse cx="13.5" cy="13" rx="3.2" ry="1.9" transform="rotate(-22 13.5 13)" fill="currentColor" />
    </svg>
  )
}

function TypewriterLine({ text, delay = 0, speed = 55, cursor = true }: { text: string; delay?: number; speed?: number; cursor?: boolean }) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!started) return
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(interval)
    }, speed)
    return () => clearInterval(interval)
  }, [started, text, speed])

  const done = displayed.length === text.length

  return (
    <span>
      {displayed}
      {cursor && <span className={done ? 'animate-blink-cursor' : 'opacity-100'}>▮</span>}
    </span>
  )
}

export function HomeScreen() {
  const navigate = useNavigate()
  const tr = useT()
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [profile, setProfile] = useState<PlayerProfile>(getSavedProfile)

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <AmbientBackground />
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onSave={p => setProfile(p)}
        />
      )}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* About */}
      <button
        onClick={() => navigate('/about')}
        className="absolute top-8 left-6 w-9 h-9 flex items-center justify-center rounded-xl bg-[#1A1A1A] border border-white/10 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
        aria-label="About"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>

      {/* Settings gear */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-8 right-6 w-9 h-9 flex items-center justify-center rounded-xl bg-[#1A1A1A] border border-white/10 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Settings"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <div className="relative z-10 text-center mb-10 animate-fade-in">
        <div className="text-7xl mb-4">🎤</div>
        <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
          Called<span className="text-[#FFE500]"> Out</span>
        </h1>
        {/* Invisible placeholder reserves the full text's height so the typewriter
            animation never shifts the buttons below it */}
        <div className="relative mt-3 max-w-xs mx-auto">
          <p className="text-gray-400 text-base invisible" aria-hidden>
            {tr('tagline')}
          </p>
          <p className="text-gray-400 text-base absolute inset-0">
            <TypewriterLine key={tr('tagline')} text={tr('tagline')} delay={400} speed={80} cursor={false} />
          </p>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-4">
        {/* Profile card */}
        <button
          onClick={() => setShowProfile(true)}
          className="w-full flex items-center gap-3 bg-[#1A1A1A] rounded-2xl px-4 py-3 border border-white/5 active:scale-[0.98] transition-all"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: profile.color + '33' }}
          >
            {profile.icon}
          </div>
          {profile.name ? (
            <>
              <span className={`text-white font-semibold text-sm flex-1 text-left truncate ${profile.font}`}>
                {profile.name}
              </span>
              <span className="text-gray-500 text-xs shrink-0">{tr('edit')} ✏</span>
            </>
          ) : (
            <>
              <span className="text-gray-400 font-semibold text-sm flex-1 text-left">{tr('setProfile')}</span>
              <span className="text-gray-600 text-xs shrink-0">→</span>
            </>
          )}
        </button>

        <button
          onClick={() => navigate('/create')}
          className="btn-shine w-full py-5 rounded-2xl bg-[#FFE500] text-[#0F0F0F] font-black text-lg tracking-wide hover:bg-yellow-300 active:scale-[0.97] transition-all"
        >
          {tr('createRoom')}
        </button>
        <button
          onClick={() => navigate('/join')}
          className="w-full py-5 rounded-2xl bg-[#1A1A1A] text-white font-bold text-lg border border-white/10 hover:bg-white/5 active:scale-[0.97] transition-all"
        >
          {tr('joinRoom')}
        </button>
        <button
          onClick={() => navigate('/suggest')}
          className="w-full py-2 text-gray-500 text-sm font-semibold hover:text-[#FFE500] transition-colors"
        >
          💡 {tr('suggestQuestion')}
        </button>
      </div>

      {/* Footer credit */}
      <div className="absolute bottom-8 flex items-center gap-2 text-gray-600 font-mono text-xs select-none">
        <TypewriterLine key={tr('createdBy')} text={tr('createdBy')} delay={800} speed={60} />
        <AlienIcon className="w-4 h-4 text-gray-600" />
      </div>
    </div>
  )
}
