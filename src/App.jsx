import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Homepage from './Component/LandingPage/Homepage'
import LandingLevel1 from './Component/Level1/landingLevel1'
import Level1Dashboard from './Component/Level1/Level1Dashboard'
import AlphabetTracer from './Component/Level1/AlphabetTracer'
import ShowAndTell from './Component/Level1/ShowAndTell'
import LivingMath from './Component/Level1/LivingMath'
import SettingsPage from './Component/Navigation/Settings'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Home */}
          <Route path='/' element={<Homepage />} />

          {/* Level 1 — Explorers (Grade 1-4) */}
          <Route path='/level1' element={<LandingLevel1 />} />
          <Route path='/level1/dashboard' element={<Level1Dashboard />} />
          <Route path='/level1/interactive-tracing' element={<AlphabetTracer />} />
          <Route path='/level1/show-and-tell' element={<ShowAndTell />} />
          <Route path='/level1/living-math' element={<LivingMath />} />

          {/* Parents Panel & Settings */}
          <Route path='/settings' element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
