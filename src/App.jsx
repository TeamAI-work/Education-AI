import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Homepage from './Component/LandingPage/Homepage'
import LandingLevel1 from './Component/Level1/landingLevel1'
import Level1Dashboard from './Component/Level1/Level1Dashboard'
import AlphabetTracer from './Component/Level1/AlphabetTracer'
import ShowAndTell from './Component/Level1/ShowAndTell'
import LivingMath from './Component/Level1/LivingMath'
import SettingsPage from './Component/Navigation/Settings'

import Level2Landing from './Component/Level2/Level2Landing'
import StudyChatbot from './Component/Level2/Chat/StudyChatbot'
import AuthPage from './Component/LandingPage/AuthPage'
import UnlockOverlay from './Component/Navigation/UnlockOverlay'
import { ProtectedRoute, PublicRoute } from './lib/RouteGuards'

function App() {
  return (
    <>
      <UnlockOverlay />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path='/' element={<Homepage />} />
          <Route path='/auth' element={<PublicRoute><AuthPage /></PublicRoute>} />

          {/* Level 1 — Explorers (Grade 1-4) */}
          <Route path='/level1' element={<ProtectedRoute><Level1Dashboard /></ProtectedRoute>} />
          <Route path='/level1/interactive-tracing' element={<ProtectedRoute><AlphabetTracer /></ProtectedRoute>} />
          <Route path='/level1/show-and-tell' element={<ProtectedRoute><ShowAndTell /></ProtectedRoute>} />
          <Route path='/level1/living-math' element={<ProtectedRoute><LivingMath /></ProtectedRoute>} />

          {/* Level 2 */}
          <Route path='/level2' element={<ProtectedRoute><Level2Landing /></ProtectedRoute>} />
          <Route path='/level2/chatbot' element={<ProtectedRoute><StudyChatbot /></ProtectedRoute>} />

          {/* Parents Panel & Settings */}
          <Route path='/settings' element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
