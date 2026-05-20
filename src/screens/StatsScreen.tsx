import { useEffect, useState } from 'react'
// useState kept for playAgainVotes
import { useNavigate, useParams } from 'react-router-dom'
import { ref, update, remove } from 'firebase/database'
import { db } from '../firebase'
import { useRoom } from '../hooks/useRoom'
import { usePlayers } from '../hooks/usePlayers'
import { getOrCreatePlayerId } from '../utils/roomUtils'
import { assignTitles } from '../utils/statsUtils'

const TITLE_EMOJIS: Record<string, string> = {
  'The Main Character': '🌟',
  'The Sleeper': '😴',
  'Certified Chaotic': '💀',
  'The Hopeless Romantic': '💘',
  'Class Clown': '😂',
  'The Philosopher': '🧠',
  'Predictably You': '🔮',
  'The Wildcard': '🃏',
  'The Mysterious One': '🎭',
}

export function StatsScreen() {
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { room } = useRoom(code)
  const { players } = usePlayers(code)
  const playerId = getOrCreatePlayerId()
  const [playAgainVotes, setPlayAgainVotes] = useState<Set<string>>(new Set())
  // Reveal immediately once data arrives — no artificial delay
  const revealed = !!room && Object.keys(players).length > 0

  const me = players[playerId]
  const isHost = me?.isHost ?? false

  useEffect(() => {
    if (room?.status === 'lobby') navigate(`/lobby/${code}`)
  }, [room?.status, code, navigate])

  const activePlayers = Object.entries(players).filter(([, p]) => !p.isKicked && p.name.trim())
  const history = room?.questionHistory ?? {}
  const titles = activePlayers.length > 0 ? assignTitles(activePlayers.map(([id]) => id), history) : []

  const togglePlayAgain = () => {
    setPlayAgainVotes(prev => {
      const next = new Set(prev)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      return next
    })
  }

  const majorityWantsPlayAgain = playAgainVotes.size >= Math.ceil(activePlayers.length / 2)

  const restartGame = async () => {
    if (!isHost) return
    await update(ref(db, `rooms/${code}`), {
      status: 'category-select',
      currentQuestionIndex: 0,
      currentQuestion: { text: '', category: '' },
      questionOrder: [],
      votes: {},
      questionHistory: {},
    })
    navigate(`/lobby/${code}`)
  }

  const endGame = async () => {
    if (!isHost) return
    await remove(ref(db, `rooms/${code}`))
    navigate('/')
  }

  if (!room) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white animate-pulse">Loading...</div>

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col px-4 pt-10 pb-10">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎤</div>
        <h1 className="text-3xl font-black text-white">The Verdict Is In</h1>
        <p className="text-gray-500 text-sm mt-2">Here's how your group was called out</p>
      </div>

      {/* Title cards */}
      <div className="flex flex-col gap-3 mb-8">
        {titles.map((titleEntry, i) => {
          const player = players[titleEntry.playerId]
          if (!player) return null
          const emoji = TITLE_EMOJIS[titleEntry.title] ?? '🏷️'
          return (
            <div
              key={titleEntry.playerId}
              className={`flex items-center gap-4 p-4 rounded-2xl bg-[#1A1A1A] border border-white/5 transition-all duration-500 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: player.color + '33', border: `2px solid ${player.color}` }}
              >
                {player.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-black text-white text-base truncate ${player.font}`}>{player.name}</p>
                <p className="text-[#FFE500] font-bold text-sm">{emoji} {titleEntry.title}</p>
                <p className="text-gray-500 text-xs">{titleEntry.subtitle}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Play again votes */}
      <div className="bg-[#1A1A1A] rounded-2xl p-4 mb-4">
        <p className="text-white font-bold mb-3 text-sm">Want to play again?</p>
        <button
          onClick={togglePlayAgain}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${playAgainVotes.has(playerId) ? 'bg-[#FFE500]/20 text-[#FFE500] border border-[#FFE500]' : 'bg-white/5 text-gray-400 border border-white/10'}`}
        >
          {playAgainVotes.has(playerId) ? '✓ I want to play again' : 'Play Again?'}
        </button>
        <p className="text-gray-600 text-xs text-center mt-2">
          {playAgainVotes.size}/{activePlayers.length} players want another round
        </p>
        {isHost && majorityWantsPlayAgain && (
          <button
            onClick={restartGame}
            className="mt-3 w-full py-3 rounded-xl bg-[#FFE500] text-[#0F0F0F] font-black text-sm hover:bg-yellow-300 active:scale-[0.97] transition-all"
          >
            Restart Game 🔄
          </button>
        )}
      </div>

      {/* End game */}
      {isHost && (
        <button
          onClick={endGame}
          className="w-full py-4 rounded-2xl bg-[#FF4D4D]/10 text-[#FF4D4D] font-bold text-sm border border-[#FF4D4D]/20 hover:bg-[#FF4D4D]/20 active:scale-[0.97] transition-all"
        >
          End Game
        </button>
      )}

      {!isHost && (
        <button
          onClick={() => navigate('/')}
          className="w-full py-4 rounded-2xl bg-white/5 text-gray-400 font-bold text-sm border border-white/10 hover:bg-white/10 active:scale-[0.97] transition-all"
        >
          Leave Game
        </button>
      )}
    </div>
  )
}
