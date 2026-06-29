import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ref, update, remove } from 'firebase/database'
import { db } from '../firebase'
import { useRoom } from '../hooks/useRoom'
import { usePlayers } from '../hooks/usePlayers'
import { usePresence } from '../hooks/usePresence'
import { prefetchStats } from './prefetch'
import { useVotes } from '../hooks/useVotes'
import { getOrCreatePlayerId } from '../utils/roomUtils'
import { tallyVotes, getWinners } from '../utils/voteUtils'
import { playResultsReveal, playWinnerFanfare, playTie } from '../utils/soundUtils'
import { useT } from '../i18n'
import { QuestionCard } from '../components/QuestionCard'
import { ConfettiEffect } from '../components/ConfettiEffect'
import { ExitModal } from '../components/ExitModal'
import { SettingsButton } from '../components/SettingsButton'
import { Loader } from '../components/Loader'
import { CountUp } from '../components/CountUp'
import { Avatar } from '../components/Avatar'
import { playTrack } from '../music'

export function RevealScreen() {
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const tr = useT()
  const { room, notFound } = useRoom(code)
  const { players } = usePlayers(code)
  const playerId = getOrCreatePlayerId()
  const qIndex = room?.currentQuestionIndex ?? 0
  const votes = useVotes(code, qIndex)
  const [revealed, setRevealed] = useState(false)
  const [showExit, setShowExit] = useState(false)

  const me = players[playerId]
  const isHost = me?.isHost ?? false

  // Auto-remove this player on disconnect so they don't linger as a ghost
  usePresence(code, playerId, !!me && !me.isHost)

  useEffect(() => { playTrack('game'); prefetchStats() }, [])

  // Only navigate to lobby — GameRouter handles the playing/stats transitions
  useEffect(() => {
    if (room?.status === 'lobby') navigate(`/lobby/${code}`)
  }, [room?.status, code, navigate])

  // Navigate away if this player was kicked by the host
  useEffect(() => {
    if (me?.isKicked) navigate('/')
  }, [me?.isKicked, navigate])

  // Don't let the host sit alone — if everyone else leaves, return to the lobby
  useEffect(() => {
    if (!isHost || room?.status !== 'reveal') return
    const activeCount = Object.values(players).filter(p => !p.isKicked && p.name.trim()).length
    if (activeCount < 2) {
      update(ref(db, `rooms/${code}`), { status: 'lobby', votes: null })
    }
  }, [isHost, room?.status, players, code])

  useEffect(() => {
    if (room?.status === 'reveal' && !revealed) {
      playResultsReveal()
      setTimeout(() => setRevealed(true), 400)
    }
  }, [room?.status, revealed])

  useEffect(() => {
    if (!revealed) return
    const isTie = winners.length > 1 || (tally[winners[0]] ?? 0) === 0
    setTimeout(() => isTie ? playTie() : playWinnerFanfare(), 600)
  }, [revealed]) // eslint-disable-line react-hooks/exhaustive-deps

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
      currentQuestion: { id: nextQ?.id ?? '', text: nextQ?.text ?? '', textAr: nextQ?.textAr ?? nextQ?.text ?? '', category: nextQ?.category ?? '', userSuggested: !!nextQ?.userSuggested },
      votes: null, // delete ALL votes — raw per-question votes are no longer needed once tallied
    })
  }

  const handleEndGame = async () => {
    await remove(ref(db, `rooms/${code}`))
    navigate('/')
  }

  const handleLeave = () => {
    if (isHost) {
      remove(ref(db, `rooms/${code}`)) // ends the game for everyone
    } else {
      remove(ref(db, `rooms/${code}/players/${playerId}`)) // remove self, fire and forget
    }
    navigate('/')
  }

  if (notFound) {
    return (
      <div className="min-h-dvh bg-[#0F0F0F] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white text-xl font-bold">{tr('roomNotFound')}</p>
        <button onClick={() => navigate('/')} className="text-[#FFE500] text-sm">{tr('goHome')}</button>
      </div>
    )
  }

  if (!room) return <Loader label={tr('loading')} />

  const maxVotes = Math.max(1, ...activePlayers.map(([pid]) => tally[pid] ?? 0))

  return (
    <div className="min-h-dvh bg-[#0F0F0F] flex flex-col px-4 pt-4 pb-8 gap-5 safe-top safe-bottom">
      {showExit && (
        <ExitModal
          isHost={isHost}
          onEndGame={handleEndGame}
          onLeave={handleLeave}
          onCancel={() => setShowExit(false)}
        />
      )}

      <ConfettiEffect trigger={revealed} />

      {/* Header with settings + exit */}
      <div className="flex items-center justify-end gap-2">
        <SettingsButton code={code} playerId={playerId} />
        <button
          onClick={() => setShowExit(true)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs font-semibold hover:text-white hover:bg-white/10 transition-all"
        >
          {tr('leave')}
        </button>
      </div>

      <QuestionCard
        key={qIndex}
        text={room.currentQuestion.text}
        textAr={room.currentQuestion.textAr}
        category={room.currentQuestion.category}
        questionNumber={qIndex + 1}
        totalQuestions={totalQuestions}
        userSuggested={room.currentQuestion.userSuggested}
      />

      {/* Results */}
      <div className="flex flex-col gap-3">
        <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">{tr('results')}</p>
        {activePlayers.map(([pid, player], idx) => {
          const v = tally[pid] ?? 0
          const isWinner = winners.includes(pid)
          return (
            <div
              key={pid}
              className={`relative overflow-hidden flex items-center gap-3 p-4 rounded-2xl bg-[#1A1A1A] transition-all duration-500 ${
                isWinner ? 'ring-2 ring-[#FFE500]' : ''
              } ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              {/* Vote-proportional bar that grows on reveal */}
              <div
                className="absolute top-0 bottom-0 transition-all duration-700 ease-out"
                style={{
                  insetInlineStart: 0,
                  width: revealed ? `${(v / maxVotes) * 100}%` : '0%',
                  backgroundColor: isWinner ? 'rgba(255,229,0,0.16)' : 'rgba(255,255,255,0.06)',
                  transitionDelay: `${idx * 80 + 150}ms`,
                }}
              />
              <Avatar icon={player.icon} color={player.color} size="md" className="relative z-10" />
              <div className="relative z-10 flex-1">
                <p className={`font-bold text-white ${player.font}`}>{player.name}</p>
                <p className="text-gray-400 text-sm"><CountUp end={v} active={revealed} /> {v !== 1 ? tr('votePlural') : tr('voteSingular')}</p>
              </div>
              {isWinner && v > 0 && (
                <span className="relative z-10 text-2xl animate-pop-in" style={{ animationDelay: `${idx * 80 + 400}ms` }}>{winners.length > 1 ? '🤝' : '👑'}</span>
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
              ? tr('calledOutTpl', { name: players[winners[0]]?.name ?? '' })
              : tr('tiedTpl', { names: winners.map(w => players[w]?.name).join(' & ') })}
          </p>
        </div>
      )}

      {/* Navigation */}
      {isHost ? (
        <button
          onClick={nextQuestion}
          className="btn-shine mt-auto w-full py-5 rounded-2xl bg-[#FFE500] text-[#0F0F0F] font-black text-lg hover:bg-yellow-300 active:scale-[0.97] transition-all"
        >
          {isLastQuestion ? tr('seeFinalStats') : tr('nextQuestion')}
        </button>
      ) : (
        <div className="mt-auto text-center text-gray-400 text-sm py-4">
          {tr('waitingHostContinue')}
        </div>
      )}
    </div>
  )
}
