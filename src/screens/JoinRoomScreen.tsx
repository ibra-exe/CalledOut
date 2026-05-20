import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ref, get, set } from 'firebase/database'
import { db } from '../firebase'
import { getOrCreatePlayerId } from '../utils/roomUtils'
import { getSavedProfile } from '../utils/profileUtils'
import { QRScanner } from '../components/QRScanner'

export function JoinRoomScreen() {
  const navigate = useNavigate()
  const { code: urlCode } = useParams<{ code?: string }>()
  const [code, setCode] = useState(urlCode ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (urlCode) joinRoom(urlCode)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const joinRoom = async (roomCode: string) => {
    const clean = roomCode.trim().toUpperCase()
    if (clean.length !== 6) { setError('Room code must be 6 characters'); return }
    setLoading(true)
    setError('')
    const snap = await get(ref(db, `rooms/${clean}`))
    if (!snap.exists()) {
      setError('Room not found. Check the code and try again.')
      setLoading(false)
      return
    }
    const room = snap.val()
    if (room.status !== 'lobby') {
      setError('This game has already started.')
      setLoading(false)
      return
    }
    const playerId = getOrCreatePlayerId()
    const existingPlayer = room.players?.[playerId]
    if (!existingPlayer) {
      const saved = getSavedProfile()
      await set(ref(db, `rooms/${clean}/players/${playerId}`), {
        name: saved.name,
        icon: saved.icon,
        color: saved.color,
        font: saved.font,
        isHost: false,
        isKicked: false,
        joinedAt: Date.now(),
      })
    }
    navigate(`/lobby/${clean}`)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('file-qr-reader')
      const result = await scanner.scanFile(file, false)
      const match = result.match(/\/join\/([A-Z0-9]{6})/i)
      const scannedCode = match ? match[1].toUpperCase() : result.trim().toUpperCase().slice(0, 6)
      setCode(scannedCode)
      await joinRoom(scannedCode)
    } catch {
      setError('Could not read QR code from image.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col px-6 py-12">
      {showScanner && (
        <QRScanner
          onScan={async (scanned) => {
            setShowScanner(false)
            setCode(scanned)
            await joinRoom(scanned)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      <button onClick={() => navigate('/')} className="text-gray-400 text-sm mb-8 self-start">
        ← Back
      </button>

      <div className="flex-1 flex flex-col justify-center gap-8 max-w-sm mx-auto w-full">
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-2">Join a Room</h1>
          <p className="text-gray-400 text-sm">Enter the room code or scan the QR</p>
        </div>

        {/* Manual input */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ENTER CODE"
            className="w-full py-4 px-5 bg-[#1A1A1A] rounded-2xl text-white text-2xl font-black text-center tracking-[0.3em] border-2 border-transparent focus:border-[#FFE500] outline-none placeholder-gray-600 uppercase"
            maxLength={6}
            onKeyDown={e => e.key === 'Enter' && joinRoom(code)}
          />
          {error && <p className="text-[#FF4D4D] text-sm text-center">{error}</p>}
          <button
            onClick={() => joinRoom(code)}
            disabled={loading}
            className="w-full py-5 rounded-2xl bg-[#FFE500] text-[#0F0F0F] font-black text-lg hover:bg-yellow-300 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-gray-600 text-sm">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Scan options */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="flex-1 py-4 rounded-2xl bg-[#1A1A1A] border border-white/10 text-white font-semibold text-sm hover:bg-white/5 active:scale-[0.97] transition-all min-h-[56px]"
          >
            📷 Scan QR
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 py-4 rounded-2xl bg-[#1A1A1A] border border-white/10 text-white font-semibold text-sm hover:bg-white/5 active:scale-[0.97] transition-all min-h-[56px]"
          >
            🖼 Upload QR
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          <div id="file-qr-reader" className="hidden" />
        </div>
      </div>
    </div>
  )
}
