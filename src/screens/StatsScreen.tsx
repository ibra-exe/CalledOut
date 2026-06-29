import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ref, update, remove, set } from 'firebase/database'
import { db } from '../firebase'
import { useRoom } from '../hooks/useRoom'
import { usePlayers } from '../hooks/usePlayers'
import { getOrCreatePlayerId } from '../utils/roomUtils'
import { assignTitles } from '../utils/statsUtils'
import { playGameOver, playTitleAssigned } from '../utils/soundUtils'
import { Loader } from '../components/Loader'
import { Avatar } from '../components/Avatar'
import { AmbientBackground } from '../components/AmbientBackground'
import { playTrack } from '../music'
import { useT } from '../i18n'

// Keyed by titleId (see statsUtils TITLE_DEFS)
const TITLE_EMOJIS: Record<string, string> = {
  main_character: '🌟',
  sleeper: '😴',
  wildcard: '🃏',
  predictably: '🔮',
  menace: '🔥',
  class_clown: '😂',
  philosopher: '🧠',
  chaotic: '💀',
  romantic: '💘',
  legend: '🏆',
  cringe: '😬',
  daredevil: '🌶️',
  their_own_fan: '🪞',
  mysterious: '🎭',
  forgotten: '👻',
}

export function StatsScreen() {
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const tr = useT()
  const { room, notFound } = useRoom(code)
  const { players } = usePlayers(code)
  const playerId = getOrCreatePlayerId()
  // Reveal immediately once data arrives — no artificial delay
  const revealed = !!room && Object.keys(players).length > 0

  const me = players[playerId]
  const isHost = me?.isHost ?? false

  useEffect(() => { playTrack('home') }, [])

  // Room deleted (host ended game) → go home
  useEffect(() => {
    if (notFound) navigate('/')
  }, [notFound, navigate])

  // Restart navigates status to category-select → return to lobby
  useEffect(() => {
    if (room?.status === 'lobby' || room?.status === 'category-select') navigate(`/lobby/${code}`)
  }, [room?.status, code, navigate])

  const hasSounded = useRef(false)
  useEffect(() => {
    if (!revealed || hasSounded.current) return
    hasSounded.current = true
    playGameOver()
    titles.forEach((_, i) => setTimeout(() => playTitleAssigned(), 700 + i * 120))
  }, [revealed]) // eslint-disable-line react-hooks/exhaustive-deps

  const activePlayers = Object.entries(players).filter(([, p]) => !p.isKicked && p.name.trim())
  const history = room?.questionHistory ?? {}
  const titles = activePlayers.length > 0 ? assignTitles(activePlayers.map(([id]) => id), history) : []

  // Play-again votes are synced via Firebase so every player sees the shared count
  const activeIds = new Set(activePlayers.map(([id]) => id))
  const playAgainRaw = room?.playAgain ?? {}
  const playAgainCount = Object.keys(playAgainRaw).filter(id => playAgainRaw[id] && activeIds.has(id)).length
  const iWantPlayAgain = !!playAgainRaw[playerId]
  const majorityWantsPlayAgain = activePlayers.length > 0 && playAgainCount >= Math.ceil(activePlayers.length / 2)

  const togglePlayAgain = async () => {
    if (iWantPlayAgain) await remove(ref(db, `rooms/${code}/playAgain/${playerId}`))
    else await set(ref(db, `rooms/${code}/playAgain/${playerId}`), true)
  }

  const restartGame = async () => {
    if (!isHost) return
    await update(ref(db, `rooms/${code}`), {
      status: 'category-select',
      currentQuestionIndex: 0,
      currentQuestion: { text: '', category: '' },
      questionOrder: [],
      votes: {},
      questionHistory: {},
      playAgain: null, // clear votes for the next round
    })
    navigate(`/lobby/${code}`)
  }

  const endGame = async () => {
    if (!isHost) return
    await remove(ref(db, `rooms/${code}`))
    navigate('/')
  }

  if (!room) return <Loader label={tr('loading')} />

  return (
    <div className="relative overflow-hidden min-h-dvh bg-[#0F0F0F] flex flex-col px-4 pt-10 pb-10 safe-top safe-bottom">
      <AmbientBackground />
      <div className="relative z-10 flex flex-col">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3 animate-pop-in">🎤</div>
        <h1 className="text-3xl font-black text-white">{tr('verdictIn')}</h1>
        <p className="text-gray-400 text-sm mt-2">{tr('howCalledOut')}</p>
      </div>

      {/* Title cards */}
      <div className="flex flex-col gap-3 mb-8">
        {titles.map((titleEntry, i) => {
          const player = players[titleEntry.playerId]
          if (!player) return null
          const emoji = TITLE_EMOJIS[titleEntry.titleId] ?? '🏷️'
          return (
            <div
              key={titleEntry.playerId}
              className={`flex items-center gap-4 p-4 rounded-2xl bg-[#1A1A1A] border border-white/5 transition-all duration-500 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <Avatar icon={player.icon} color={player.color} size="lg" />
              <div className="flex-1 min-w-0">
                <p className={`font-black text-white text-base truncate ${player.font}`}>{player.name}</p>
                <p className="text-[#FFE500] font-bold text-sm">{emoji} {tr(`title_${titleEntry.titleId}`)}</p>
                <p className="text-gray-400 text-xs">{tr(`sub_${titleEntry.titleId}`, titleEntry.params)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Play again votes */}
      <div className="bg-[#1A1A1A] rounded-2xl p-4 mb-4">
        <p className="text-white font-bold mb-3 text-sm">{tr('wantPlayAgain')}</p>
        <button
          onClick={togglePlayAgain}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${iWantPlayAgain ? 'bg-[#FFE500]/20 text-[#FFE500] border border-[#FFE500]' : 'bg-white/5 text-gray-400 border border-white/10'}`}
        >
          {iWantPlayAgain ? `✓ ${tr('iWantPlayAgain')}` : tr('playAgainQ')}
        </button>
        <p className="text-gray-600 text-xs text-center mt-2">
          {tr('playersWantRoundTpl', { n: playAgainCount, m: activePlayers.length })}
        </p>
        {/* Host can always restart; the button lights up once the group is on board */}
        {isHost && (
          <button
            onClick={restartGame}
            className={`mt-3 w-full py-3 rounded-xl font-black text-sm active:scale-[0.97] transition-all ${
              majorityWantsPlayAgain
                ? 'bg-[#FFE500] text-[#0F0F0F] hover:bg-yellow-300'
                : 'bg-[#FFE500]/15 text-[#FFE500] border border-[#FFE500]/30 hover:bg-[#FFE500]/25'
            }`}
          >
            {tr('restartGame')}
          </button>
        )}
      </div>

      {/* End game */}
      {isHost && (
        <button
          onClick={endGame}
          className="w-full py-4 rounded-2xl bg-[#FF4D4D]/10 text-[#FF4D4D] font-bold text-sm border border-[#FF4D4D]/20 hover:bg-[#FF4D4D]/20 active:scale-[0.97] transition-all"
        >
          {tr('endGame')}
        </button>
      )}

      {!isHost && (
        <button
          onClick={() => navigate('/')}
          className="w-full py-4 rounded-2xl bg-white/5 text-gray-400 font-bold text-sm border border-white/10 hover:bg-white/10 active:scale-[0.97] transition-all"
        >
          {tr('leaveGame')}
        </button>
      )}
      </div>
    </div>
  )
}
