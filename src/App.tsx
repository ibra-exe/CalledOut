import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { CreateRoomScreen } from './screens/CreateRoomScreen'
import { JoinRoomScreen } from './screens/JoinRoomScreen'
import { LobbyScreen } from './screens/LobbyScreen'
import { GameScreen } from './screens/GameScreen'
import { RevealScreen } from './screens/RevealScreen'
import { StatsScreen } from './screens/StatsScreen'
import { useRoom } from './hooks/useRoom'
import { useParams } from 'react-router-dom'

// Smart game router: renders game or reveal based on room status
function GameRouter() {
  const { code = '' } = useParams<{ code: string }>()
  const { room, loading } = useRoom(code)

  if (loading) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white animate-pulse">Loading...</div>
  if (!room) return <Navigate to="/" />
  if (room.status === 'reveal') return <RevealScreen />
  if (room.status === 'stats') return <Navigate to={`/stats/${code}`} />
  if (room.status === 'lobby' || room.status === 'category-select') return <Navigate to={`/lobby/${code}`} />
  return <GameScreen />
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="font-sans antialiased">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/create" element={<CreateRoomScreen />} />
          <Route path="/join" element={<JoinRoomScreen />} />
          <Route path="/join/:code" element={<JoinRoomScreen />} />
          <Route path="/lobby/:code" element={<LobbyScreen />} />
          <Route path="/game/:code" element={<GameRouter />} />
          <Route path="/stats/:code" element={<StatsScreen />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
