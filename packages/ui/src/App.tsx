import { Route, Routes } from 'react-router-dom'

import IndexPage from './pages/index'
import AboutPage from './pages/about'

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<AboutPage />} path="/about" />
    </Routes>
  )
}

export default App
