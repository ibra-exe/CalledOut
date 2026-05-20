import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ref, set } from 'firebase/database'
import { db } from '../firebase'
import { generateCode, getOrCreatePlayerId } from '../utils/roomUtils'
import { getSavedProfile } from '../utils/profileUtils'
import { QRDisplay } from '../components/QRDisplay'

export function CreateRoomScreen() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const create = async () => {
      const newCode = generateCode()
      const hostId = getOrCreatePlayerId()
      await set(ref(db, `rooms/${newCode}`), {
        status: 'lobby',
        hostId,
        currentQuestionIndex: 0,
        currentQuestion: { text: '', category: '' },
        categories: [],
        questionOrder: [],
        createdAt: Date.now(),
        settings: { timerSeconds: 30, autoAdvance: true },
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

      setCode(newCode)
      setLoading(false)
    }
    create()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="text-white text-lg font-semibold animate-pulse">Creating room...</div>
      </div>
    )
  }

  const joinUrl = `${window.location.origin}/join/${code}`

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col px-6 py-12">
      <button onClick={() => navigate('/')} className="text-gray-400 text-sm mb-8 self-start">
        ← Back
      </button>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-2">Room Created!</h1>
          <p className="text-gray-400 text-sm">Share the code or QR with your friends</p>
        </div>

        <QRDisplay code={code} joinUrl={joinUrl} />

        <button
          onClick={() => navigate(`/lobby/${code}`)}
          className="w-full max-w-sm py-5 rounded-2xl bg-[#FFE500] text-[#0F0F0F] font-black text-lg hover:bg-yellow-300 active:scale-[0.97] transition-all"
        >
          Go to Lobby →
        </button>
      </div>
    </div>
  )
}
