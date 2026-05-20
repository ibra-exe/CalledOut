import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ref, update, remove } from 'firebase/database'
import { db } from '../firebase'
import { useRoom } from '../hooks/useRoom'
import { usePlayers } from '../hooks/usePlayers'
import { useVotes } from '../hooks/useVotes'
import { getOrCreatePlayerId } from '../utils/roomUtils'
import { tallyVotes, getWinners } from '../utils/voteUtils'
import { QuestionCard } from '../components/QuestionCard'
import { ConfettiEffect } from '../components/ConfettiEffect'
import { ExitModal } from '../components/ExitModal'

export function RevealScreen() {
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { room } = useRoom(code)
  const { players } = usePlayers(code)
  const playerId = getOrCreatePlayerId()
  const qIndex = room?.currentQuestionIndex ?? 0
  const votes = useVotes(code, qIndex)
  const [revealed, setRevealed] = useState(false)
  const [showExit, setShowExit] = useState(false)

  const me = players[playerId]
  const isHost = me?.isHost ?? false

  // Only navigate to lobby — GameRouter handles the playing/stats transitions
  useEffect(() => {
    if (room?.status === 'lobby') navigate(`/lobby/${code}`)
  }, [room?.status, code, navigate])

  useEffect(() => {
    if (room?.status === 'reveal' && !revealed) {
      setTimeout(() => setRevealed(true), 400)
    }
  }, [room?.status, revealed])

  const tally = tallyVotes(votes)
  const winners = getWinners(tally)
  const activePlayers = Object.entries(players)
    .filter(([, p]) => !p.isKicked && p.name.trim())
    .sort(([a], [b]) => (tally[b] ?? 0) - (tally[a] ?? 0))

  const totalQuestions = Object.keys(room?.questionHistory ?? {}).length
  const isLastQuestion = qIndex >= totalQuestions - 1

  const nextQuestion = async () => {
    if (!isHost) return
    if (isLastQuestion) {
      await update(ref(db, `rooms/${code}`), { status: 'stats' })
      return
    }
    const nextIndex = qIndex + 1
    const nextQ = room?.questionHistory?.[nextIndex]
    await update(ref(db, `rooms/${code}`), {
      status: 'playing',
      currentQuestionIndex: nextIndex,
      currentQuestion: { text: nextQ?.text ?? '', category: nextQ?.category ?? '' },
    })
  }

  const handleEndGame = async () => {
    await remove(ref(db, `rooms/${code}`))
    navigate('/')
  }

  const handleLeave = async () => {
    const activePlayers = Object.entries(players).filter(([, p]) => !p.isKicked && p.name.trim())
    if (isHost) {
      const others = activePlayers.filter(([pid]) => pid !== playerId)
      if (others.length > 0) {
        const [newHostId] = others[0]
        await update(ref(db, `rooms/${code}/players/${newHostId}`), { isHost: true })
        await update(ref(db, `rooms/${code}`), { hostId: newHostId })
      }
    }
    await update(ref(db, `rooms/${code}/players/${playerId}`), { isKicked: true })
    navigate('/')
  }

  if (!room) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white animate-pulse">Loading...</div>

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col px-4 pt-4 pb-8 gap-5">
      {showExit && (
        <ExitModal
          isHost={isHost}
          onEndGame={handleEndGame}
          onLeave={handleLeave}
          onCancel={() => setShowExit(false)}
        />
      )}

      <ConfettiEffect trigger={revealed} />

      {/* Header with exit */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowExit(true)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-xs font-semibold hover:text-white hover:bg-white/10 transition-all"
        >
          Leave
        </button>
      </div>

      <QuestionCard
        text={room.currentQuestion.text}
        category={room.currentQuestion.category}
        questionNumber={qIndex + 1}
        totalQuestions={totalQuestions}
      />

      {/* Results */}
      <div className="flex flex-col gap-3">
        <p className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Results</p>
        {activePlayers.map(([pid, player]) => {
          const v = tally[pid] ?? 0
          const isWinner = winners.includes(pid)
          return (
            <div
              key={pid}
              className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-500 ${
                isWinner ? 'bg-[#FFE500]/10 ring-2 ring-[#FFE500]' : 'bg-[#1A1A1A]'
              } ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${activePlayers.findIndex(([id]) => id === pid) * 80}ms` }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: player.color + '33', border: `2px solid ${player.color}` }}
              >
                {player.icon}
              </div>
              <div className="flex-1">
                <p className={`font-bold text-white ${player.font}`}>{player.name}</p>
                <p className="text-gray-400 text-sm">{v} vote{v !== 1 ? 's' : ''}</p>
              </div>
              {isWinner && v > 0 && (
                <span className="text-2xl">{winners.length > 1 ? '🤝' : '👑'}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Winner announcement */}
      {revealed && winners.length > 0 && (tally[winners[0]] ?? 0) > 0 && (
        <div className="bg-[#FFE500]/5 border border-[#FFE500]/20 rounded-2xl p-4 text-center">
          <p className="text-[#FFE500] font-black text-lg">
            {winners.length === 1
              ? `${players[winners[0]]?.name} was Called Out! 🎤`
              : `${winners.map(w => players[w]?.name).join(' & ')} tied! 🤝`}
          </p>
        </div>
      )}

      {/* Navigation */}
      {isHost ? (
        <button
          onClick={nextQuestion}
          className="mt-auto w-full py-5 rounded-2xl bg-[#FFE500] text-[#0F0F0F] font-black text-lg hover:bg-yellow-300 active:scale-[0.97] transition-all"
        >
          {isLastQuestion ? 'See Final Stats →' : 'Next Question →'}
        </button>
      ) : (
        <div className="mt-auto text-center text-gray-500 text-sm py-4">
          Waiting for host to continue...
        </div>
      )}
    </div>
  )
}
