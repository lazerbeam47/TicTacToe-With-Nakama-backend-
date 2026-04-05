// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from '@/lib/store'
import LoginPage      from '@/components/LoginPage'
import LobbyPage      from '@/components/LobbyPage'
import GamePage       from '@/components/GamePage'
import LeaderboardPage from '@/components/LeaderboardPage'
import NotificationStack from '@/components/NotificationStack'

function RequireAuth({ children }) {
  const session = useStore(s => s.session)
  return session ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="scanlines min-h-screen">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RequireAuth><LobbyPage /></RequireAuth>} />
          <Route path="/game" element={<RequireAuth><GamePage /></RequireAuth>} />
          <Route path="/leaderboard" element={<RequireAuth><LeaderboardPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <NotificationStack />
      </div>
    </BrowserRouter>
  )
}
