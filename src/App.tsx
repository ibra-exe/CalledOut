import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { HomeScreen } from './screens/HomeScreen'
import { applyDir, useLang } from './i18n'
import { Loader } from './components/Loader'

// Home is eager (it's the landing route). Everything else is lazy so the first
// paint chunk excludes Firebase, html5-qrcode, canvas-confetti, the question
// bank, and all non-home screen code — each loads on demand for its route.
const CreateRoomScreen = lazy(() => import('./screens/CreateRoomScreen').then(m => ({ default: m.CreateRoomScreen })))
const JoinRoomScreen = lazy(() => import('./screens/JoinRoomScreen').then(m => ({ default: m.JoinRoomScreen })))
const LobbyScreen = lazy(() => import('./screens/LobbyScreen').then(m => ({ default: m.LobbyScreen })))
const GameRouter = lazy(() => import('./screens/GameRouter').then(m => ({ default: m.GameRouter })))
const StatsScreen = lazy(() => import('./screens/StatsScreen').then(m => ({ default: m.StatsScreen })))
const AboutScreen = lazy(() => import('./screens/AboutScreen').then(m => ({ default: m.AboutScreen })))
const AdminScreen = lazy(() => import('./screens/AdminScreen').then(m => ({ default: m.AdminScreen })))
const SuggestScreen = lazy(() => import('./screens/SuggestScreen').then(m => ({ default: m.SuggestScreen })))

// Plays a subtle entrance animation whenever the route (pathname) changes
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="animate-route-in">
      <Suspense fallback={<Loader />}>
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
      </Suspense>
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
