import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { CreateRoomScreen } from './screens/CreateRoomScreen'
import { JoinRoomScreen } from './screens/JoinRoomScreen'
import { LobbyScreen } from './screens/LobbyScreen'
import { GameScreen } from './screens/GameScreen'
import { RevealScreen } from './screens/RevealScreen'
import { StatsScreen } from './screens/StatsScreen'
import { AboutScreen } from './screens/AboutScreen'
import { AdminScreen } from './screens/AdminScreen'
import { SuggestScreen } from './screens/SuggestScreen'
import { useRoom } from './hooks/useRoom'
import { useParams, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { applyDir, useLang } from './i18n'
import { Loader } from './components/Loader'

// Smart game router: renders game or reveal based on room status
function GameRouter() {
  const { code = '' } = useParams<{ code: string }>()
  const { room, loading } = useRoom(code)

  if (loading) return <Loader />
  if (!room) return <Navigate to="/" />
  if (room.status === 'reveal') return <RevealScreen />
  if (room.status === 'stats') return <Navigate to={`/stats/${code}`} />
  if (room.status === 'lobby' || room.status === 'category-select') return <Navigate to={`/lobby/${code}`} />
  return <GameScreen />
}

// Plays a subtle entrance animation whenever the route (pathname) changes
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="animate-route-in">
      <Routes location={location}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/create" element={<CreateRoomScreen />} />
        <Route path="/join" element={<JoinRoomScreen />} />
        <Route path="/join/:code" element={<JoinRoomScreen />} />
        <Route path="/lobby/:code" element={<LobbyScreen />} />
        <Route path="/game/:code" element={<GameRouter />} />
        <Route path="/stats/:code" element={<StatsScreen />} />
        <Route path="/about" element={<AboutScreen />} />
        <Route path="/admin" element={<AdminScreen />} />
        <Route path="/suggest" element={<SuggestScreen />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default function App() {
  // Keep <html dir/lang> in sync with the selected language (RTL for Arabic)
  const lang = useLang()
  useEffect(() => {
    applyDir(lang)
  }, [lang])

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="font-sans antialiased">
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  )
}
