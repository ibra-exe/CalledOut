import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ref, update, remove } from 'firebase/database'
import { db } from '../firebase'
import { useRoom } from '../hooks/useRoom'
import { usePlayers } from '../hooks/usePlayers'
import { getOrCreatePlayerId } from '../utils/roomUtils'
import { getSavedProfile, saveProfileLocally } from '../utils/profileUtils'
import { PlayerCard } from '../components/PlayerCard'
import { EmojiPicker } from '../components/EmojiPicker'
import { ColorPicker } from '../components/ColorPicker'
import { FontPicker } from '../components/FontPicker'
import { QRDisplay } from '../components/QRDisplay'
import { CategorySelectScreen } from './CategorySelectScreen'

export function LobbyScreen() {
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { room, loading: roomLoading, notFound } = useRoom(code)
  const { players } = usePlayers(code)
  const playerId = getOrCreatePlayerId()

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🙂')
  const [color, setColor] = useState('#2196F3')
  const [font, setFont] = useState('font-sans')
  const [saving, setSaving] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showCategorySelect, setShowCategorySelect] = useState(false)
  const [tab, setTab] = useState<'icon' | 'color' | 'font'>('icon')

  const me = players[playerId]
  const isHost = me?.isHost ?? false

  // Auto-write saved profile to Firebase on mount
  useEffect(() => {
    const saved = getSavedProfile()
    if (saved.name.trim()) {
      update(ref(db, `rooms/${code}/players/${playerId}`), {
        name: saved.name,
        icon: saved.icon,
        color: saved.color,
        font: saved.font,
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync player profile from Firebase on mount (fallback for manual edits)
  useEffect(() => {
    if (me) {
      setName(me.name || '')
      setIcon(me.icon || '🙂')
      setColor(me.color || '#2196F3')
      setFont(me.font || 'font-sans')
    }
  }, [!!me]) // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if kicked
  useEffect(() => {
    if (me?.isKicked) navigate('/')
  }, [me?.isKicked, navigate])

  // Redirect when game starts
  useEffect(() => {
    if (room?.status === 'playing' || room?.status === 'reveal') navigate(`/game/${code}`)
    if (room?.status === 'stats') navigate(`/stats/${code}`)
  }, [room?.status, code, navigate])

  const saveProfile = async () => {
    if (!name.trim()) return
    setSaving(true)
    await update(ref(db, `rooms/${code}/players/${playerId}`), { name: name.trim(), icon, color, font })
    saveProfileLocally({ name: name.trim(), icon, color, font })
    setSaving(false)
  }

  const kickPlayer = async (pid: string) => {
    await update(ref(db, `rooms/${code}/players/${pid}`), { isKicked: true })
  }

  const leaveRoom = async () => {
    if (isHost) {
      await remove(ref(db, `rooms/${code}`))
    } else {
      await remove(ref(db, `rooms/${code}/players/${playerId}`))
    }
    navigate('/')
  }

  const namedPlayers = Object.entries(players).filter(([, p]) => !p.isKicked && p.name.trim())
  const canStart = namedPlayers.length >= 2
  const showProfileSection = !!me && !me.name?.trim() && !getSavedProfile().name.trim()

  if (roomLoading) {
    return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white animate-pulse">Loading...</div>
  }
  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white text-xl font-bold">Room not found</p>
        <button onClick={() => navigate('/')} className="text-[#FFE500] text-sm">← Go Home</button>
      </div>
    )
  }

  const joinUrl = `${window.location.origin}/join/${code}`

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col pb-6">
      {showCategorySelect && (
        <CategorySelectScreen
          code={code}
          onClose={() => setShowCategorySelect(false)}
        />
      )}

      {/* Header */}
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={leaveRoom}
              className="text-gray-500 hover:text-white transition-colors text-sm font-semibold"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-black text-white">Lobby</h1>
          </div>
          <button
            onClick={() => setShowQR(!showQR)}
            className="px-3 py-2 rounded-xl bg-[#1A1A1A] text-white text-sm font-semibold border border-white/10"
          >
            {showQR ? 'Hide' : '+ Invite'}
          </button>
        </div>

        {showQR && (
          <div className="mt-4 p-4 bg-[#1A1A1A] rounded-2xl">
            <QRDisplay code={code} joinUrl={joinUrl} />
          </div>
        )}
      </div>

      {/* Profile setup — only shown if player hasn't set a profile yet */}
      {showProfileSection && <div className="px-4 mb-4">
        <div className="bg-[#1A1A1A] rounded-3xl p-4">
          <p className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Your Profile</p>

          {/* Name */}
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value.slice(0, 20))}
            placeholder="Your name..."
            className="w-full py-3 px-4 bg-[#0F0F0F] rounded-xl text-white font-semibold border-2 border-transparent focus:border-[#FFE500] outline-none placeholder-gray-600 mb-3"
            maxLength={20}
          />

          {/* Tabs */}
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
            onClick={saveProfile}
            disabled={!name.trim() || saving}
            className="mt-4 w-full py-3 rounded-xl bg-[#FFE500] text-[#0F0F0F] font-black text-sm hover:bg-yellow-300 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>}

      {/* Players list */}
      <div className="px-4 flex-1">
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-3 font-semibold">
          Players ({Object.values(players).filter(p => !p.isKicked).length})
        </p>
        <div className="flex flex-col gap-2">
          {Object.entries(players)
            .filter(([, p]) => !p.isKicked)
            .sort(([, a], [, b]) => a.joinedAt - b.joinedAt)
            .map(([pid, player]) => (
              <PlayerCard
                key={pid}
                player={player}
                playerId={pid}
                onKick={isHost && !player.isHost && pid !== playerId ? () => kickPlayer(pid) : undefined}
              />
            ))}
        </div>
      </div>

      {/* Host actions */}
      {isHost && (
        <div className="px-4 mt-6">
          <button
            onClick={() => setShowCategorySelect(true)}
            disabled={!canStart}
            className="w-full py-5 rounded-2xl bg-[#FFE500] text-[#0F0F0F] font-black text-lg hover:bg-yellow-300 active:scale-[0.97] transition-all disabled:opacity-40"
          >
            Choose Categories →
          </button>
          {!canStart && (
            <p className="text-center text-gray-500 text-xs mt-2">Need at least 2 named players to start</p>
          )}
        </div>
      )}

      {!isHost && (
        <div className="px-4 mt-6 text-center">
          <p className="text-gray-500 text-sm">Waiting for host to start the game...</p>
        </div>
      )}
    </div>
  )
}
