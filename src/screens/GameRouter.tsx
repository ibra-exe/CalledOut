import { Navigate, useParams } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom'
import { GameScreen } from './GameScreen'
import { RevealScreen } from './RevealScreen'
import { Loader } from '../components/Loader'
import { ConnectionBanner } from '../components/ConnectionBanner'

// Renders the game or reveal screen based on live room status. Lives in its own
// module (not App.tsx) so the route can be lazy-loaded — that keeps Firebase
// (pulled in via useRoom) and the in-game screens off the first-paint chunk.
// GameScreen + RevealScreen are imported statically here so they share one chunk
// and the playing↔reveal switch never has to fetch anything mid-game.
export function GameRouter() {
  const { code = '' } = useParams<{ code: string }>()
  const { room, loading } = useRoom(code)

  if (loading) return <Loader />
  if (!room) return <Navigate to="/" />
  if (room.status === 'stats') return <Navigate to={`/stats/${code}`} />
  if (room.status === 'lobby' || room.status === 'category-select') return <Navigate to={`/lobby/${code}`} />
  return (
    <>
      <ConnectionBanner />
      {room.status === 'reveal' ? <RevealScreen /> : <GameScreen />}
    </>
  )
}
