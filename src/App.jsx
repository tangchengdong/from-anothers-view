import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Discover from './pages/Discover'
import ContentDetail from './pages/ContentDetail'
import SearchResults from './pages/SearchResults'
import MindPalace from './pages/MindPalace'
import DebateRoom from './components/DebateRoom'
import './App.css'

function App() {
  const location = useLocation()
  const { selectedPerspectives } = useAppStore()
  const isHome = location.pathname === '/' || location.pathname === ''
  const isMindPalace = location.pathname === '/mind-palace' || location.hash === '#/mind-palace'
  const [showDebateRoom, setShowDebateRoom] = useState(false)

  useEffect(() => {
    document.body.classList.remove('paper-theme', 'dark-theme')
    document.body.classList.add('paper-theme')
  }, [isHome])

  useEffect(() => {
    const handleOpenDebate = () => setShowDebateRoom(true)
    window.addEventListener('open-debate-room', handleOpenDebate)
    return () => window.removeEventListener('open-debate-room', handleOpenDebate)
  }, [])

  const hasPerspectives = selectedPerspectives && selectedPerspectives.length > 0

  return (
    <div className={`app ${isMindPalace ? 'app-mind-palace' : 'app-paper'}`}>
      {!isMindPalace && <Header />}
      <main className={isMindPalace ? 'main-content-mind-palace' : 'main-content'}>
        <Routes>
          <Route path="/" element={
            hasPerspectives ? <Navigate to="/discover" replace /> : <Home />
          } />
          <Route path="/discover" element={
            !hasPerspectives ? <Navigate to="/" replace /> : <Discover />
          } />
          <Route path="/mind-palace" element={<MindPalace />} />
          <Route path="/content/:id" element={<ContentDetail />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isHome && !isMindPalace && <Footer />}
      {showDebateRoom && <DebateRoom onClose={() => setShowDebateRoom(false)} />}
    </div>
  )
}

export default App
