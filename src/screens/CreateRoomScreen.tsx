import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ref, set } from 'firebase/database'
import { db } from '../firebase'
import { generateCode, getOrCreatePlayerId } from '../utils/roomUtils'
import { getSavedProfile } from '../utils/profileUtils'
import { QRDisplay } from '../components/QRDisplay'
import { Loader } from '../components/Loader'
import { prefetchLobby } from './prefetch'
import { useT } from '../i18n'

export function CreateRoomScreen() {
  const navigate = useNavigate()
  const tr = useT()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const create = useCallback(async () => {
    setError(false)
    setLoading(true)
    const newCode = generateCode()
    const hostId = getOrCreatePlayerId()
    try {
      const writes = (async () => {
        await set(ref(db, `rooms/${newCode}`), {
          status: 'lobby',
          hostId,
          currentQuestionIndex: 0,
          currentQuestion: { text: '', category: '' },
          categories: [],
          questionOrder: [],
          createdAt: Date.now(),
          settings: { timerSeconds: 15, allowRevoting: false },
          players: {},
          votes: {},
          questionHistory: {},
        })

        const saved = getSavedProfile()
        await set(ref(db, `rooms/${newCode}/players/${hostId}`), {
          name: saved.name,
          icon: saved.icon,
          color: saved.color,
          font: saved.font,
          isHost: true,
          isKicked: false,
          joinedAt: Date.now(),
        })
      })()

      // Firebase queues writes silently while offline and the promise never
      // settles — race a timeout so the host isn't stranded on the loader.
      await Promise.race([
        writes,
        new Promise((_resolve, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
      ])

      setCode(newCode)
      setLoading(false)
    } catch {
      setError(true)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    create()
    prefetchLobby() // host heads to the lobby next
  }, [create])

  if (error) {
    return (
      <div className="min-h-dvh bg-[#0F0F0F] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-5xl">📡</div>
        <div>
          <h1 className="text-2xl font-black text-white mb-2">{tr('createFailed')}</h1>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">{tr('createFailedDesc')}</p>
        </div>
        <div className="w-full max-w-sm flex flex-col gap-3">
          <button
            onClick={create}
            className="w-full py-4 rounded-2xl bg-[#FFE500] text-[#0F0F0F] font-black text-lg active:scale-[0.97] transition-all"
          >
            {tr('tryAgain')}
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 rounded-2xl bg-[#1A1A1A] text-white font-bold border border-white/10 active:scale-[0.97] transition-all"
          >
            {tr('goHome')}
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <Loader label={tr('creatingRoom')} />
  }

  const joinUrl = `${window.location.origin}/join/${code}`

  return (
    <div className="min-h-dvh bg-[#0F0F0F] flex flex-col px-6 py-12">
      <button onClick={() => navigate('/')} className="text-gray-400 text-sm mb-8 self-start">
        ← {tr('back')}
      </button>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-2">{tr('roomCreated')}</h1>
          <p className="text-gray-400 text-sm">{tr('shareCode')}</p>
        </div>

        <QRDisplay code={code} joinUrl={joinUrl} />

        <button
          onClick={() => navigate(`/lobby/${code}`)}
          className="w-full max-w-sm py-5 rounded-2xl bg-[#FFE500] text-[#0F0F0F] font-black text-lg hover:bg-yellow-300 active:scale-[0.97] transition-all"
        >
          {tr('goToLobby')} →
        </button>
      </div>
    </div>
  )
}
