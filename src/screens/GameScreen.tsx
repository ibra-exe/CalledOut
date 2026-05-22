import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ref, set, update, remove } from 'firebase/database'
import { db } from '../firebase'
import { useRoom } from '../hooks/useRoom'
import { usePlayers } from '../hooks/usePlayers'
import { useVotes } from '../hooks/useVotes'
import { getOrCreatePlayerId } from '../utils/roomUtils'
import { QuestionCard } from '../components/QuestionCard'
import { VoteButton } from '../components/VoteButton'
import { TimerBar } from '../components/TimerBar'
import { ExitModal } from '../components/ExitModal'
import { tallyVotes } from '../utils/voteUtils'
import {
  playQuestionReveal, playGameStarting, playVoteCast,
  playTimerTick, playTimerExpire, playAllVotesIn,
} from '../utils/soundUtils'

export function GameScreen() {
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { room, notFound } = useRoom(code)
  const { players } = usePlayers(code)
  const playerId = getOrCreatePlayerId()
  const qIndex = room?.currentQuestionIndex ?? 0
  const votes = useVotes(code, qIndex)
  const [timerKey, setTimerKey] = useState(0)
  const [showExit, setShowExit] = useState(false)
  const isFirstQuestion = useRef(true)
  const hasAdvanced = useRef(false) // prevent double-fire per question

  const me = players[playerId]
  const isHost = me?.isHost ?? false
  const myVote = votes[playerId]
  const activePlayers = Object.entries(players).filter(([, p]) => !p.isKicked && p.name.trim())
  const voteCount = Object.keys(votes).length
  const totalExpected = activePlayers.length
  const allVoted = totalExpected > 0 && voteCount >= totalExpected

  const timerSeconds = room?.settings?.timerSeconds ?? 30
  const autoAdvance = room?.settings?.autoAdvance ?? true

  useEffect(() => {
    hasAdvanced.current = false // reset guard for new question
    setTimerKey(k => k + 1)
    if (isFirstQuestion.current) {
      isFirstQuestion.current = false
      playGameStarting()
    } else {
      playQuestionReveal()
    }
  }, [qIndex])

  // Only navigate to lobby — GameRouter handles reveal/stats
  useEffect(() => {
    if (room?.status === 'lobby') navigate(`/lobby/${code}`)
  }, [room?.status, code, navigate])

  // Auto-advance when all votes are in (only in autoAdvance mode)
  useEffect(() => {
    if (!allVoted) return
    if (autoAdvance && room?.status === 'playing' && isHost) {
      playAllVotesIn()
      advanceToReveal()
    }
  }, [allVoted]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep a ref to latest votes so advanceToReveal doesn't need votes in its deps
  // (avoids restarting TimerBar's interval on every vote cast)
  const votesRef = useRef(votes)
  useEffect(() => { votesRef.current = votes }, [votes])

  const castVote = async (votedFor: string) => {
    if (myVote) return
    playVoteCast()
    await set(ref(db, `rooms/${code}/votes/${qIndex}/${playerId}`), votedFor)
  }

  const advanceToReveal = useCallback(async () => {
    if (!isHost || room?.status !== 'playing') return
    if (hasAdvanced.current) return
    hasAdvanced.current = true
    const tally = tallyVotes(votesRef.current)
    // Single atomic update: no intermediate Firebase state
    await update(ref(db, `rooms/${code}`), {
      status: 'reveal',
      [`questionHistory/${qIndex}/votes`]: tally,
    })
  }, [isHost, room?.status, code, qIndex])

  const handleTimerExpire = useCallback(() => {
    playTimerExpire()
    advanceToReveal()
  }, [advanceToReveal])

  const handleTick = useCallback((remaining: number) => {
    if (remaining <= 5 && remaining > 0) playTimerTick()
  }, [])

  const handleEndGame = async () => {
    await remove(ref(db, `rooms/${code}`))
    navigate('/')
  }

  const handleLeave = async () => {
    if (isHost) {
      // Host leaving ends the game for everyone
      await remove(ref(db, `rooms/${code}`))
    } else {
      await update(ref(db, `rooms/${code}/players/${playerId}`), { isKicked: true })
    }
    navigate('/')
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white text-xl font-bold">Room not found</p>
        <button onClick={() => navigate('/')} className="text-[#FFE500] text-sm">← Go Home</button>
      </div>
    )
  }

  if (!room) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white animate-pulse">Loading...</div>

  const totalQuestions = Object.keys(room.questionHistory ?? {}).length
  const question = room.currentQuestion

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col">
      {showExit && (
        <ExitModal
          isHost={isHost}
          onEndGame={handleEndGame}
          onLeave={handleLeave}
          onCancel={() => setShowExit(false)}
        />
      )}

      {/* Timer bar */}
      <TimerBar
        key={timerKey}
        durationSeconds={timerSeconds}
        running={room.status === 'playing'}
        onExpire={isHost && autoAdvance ? handleTimerExpire : () => {}}
        onTick={handleTick}
      />

      <div className="flex-1 flex flex-col px-4 pt-4 pb-6 gap-5">
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
          text={question.text}
          category={question.category}
          questionNumber={qIndex + 1}
          totalQuestions={totalQuestions}
        />

        {/* Progress (shown to all players) */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>{voteCount}/{totalExpected} voted</span>
          {myVote && <span className="text-[#FFE500] font-semibold">Your vote is in ✓</span>}
        </div>

        {/* Vote buttons */}
        <div className="flex flex-col gap-2">
          {activePlayers
            .sort(([, a], [, b]) => a.joinedAt - b.joinedAt)
            .map(([pid, player]) => (
              <VoteButton
                key={pid}
                player={player}
                playerId={pid}
                hasVoted={!!myVote}
                isSelected={myVote === pid}
                disabled={!!myVote}
                isSelf={pid === playerId}
                onClick={() => castVote(pid)}
              />
            ))}
        </div>

        {/* Host controls */}
        {isHost && (
          <div className="mt-auto flex flex-col gap-2">
            {/* Vote progress dots */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-gray-500 text-xs font-semibold">{voteCount}/{totalExpected} voted</span>
              <div className="flex gap-1.5">
                {activePlayers
                  .sort(([, a], [, b]) => a.joinedAt - b.joinedAt)
                  .map(([pid]) => (
                    <div
                      key={pid}
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${votes[pid] ? 'bg-[#FFE500]' : 'bg-white/20'}`}
                    />
                  ))}
              </div>
            </div>

            {!autoAdvance && (
              <button
                onClick={advanceToReveal}
                disabled={!allVoted}
                className="w-full py-4 rounded-2xl bg-[#FFE500] text-[#0F0F0F] font-black text-base hover:bg-yellow-300 active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                Show Results →
              </button>
            )}
            {autoAdvance && (
              <button
                onClick={advanceToReveal}
                disabled={!allVoted}
                className="py-3 rounded-xl bg-white/5 text-gray-400 text-sm font-semibold border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                Skip to Results
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
