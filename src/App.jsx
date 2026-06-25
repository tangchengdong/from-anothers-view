import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Discover from './pages/Discover'
import ContentDetail from './pages/ContentDetail'
import SearchResults from './pages/SearchResults'
import './App.css'

function App() {
  const location = useLocation()
  const { selectedPerspectives } = useAppStore()
  const isHome = location.pathname === '/'
  const isSearch = location.pathname.startsWith('/search')

  useEffect(() => {
    document.body.classList.remove('paper-theme', 'dark-theme')
    if (isHome) {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.add('paper-theme')
    }
  }, [isHome])

  return (
    <div className={`app ${isHome ? 'app-dark' : 'app-paper'}`}>
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={
            selectedPerspectives && selectedPerspectives.length > 0 ? <Navigate to="/discover" replace /> : <Home />
          } />
          <Route path="/discover" element={
            !selectedPerspectives || selectedPerspectives.length === 0 ? <Navigate to="/" replace /> : <Discover />
          } />
          <Route path="/content/:id" element={<ContentDetail />} />
          <Route path="/search" element={<SearchResults />} />
        </Routes>
      </main>
      {!isHome && <Footer />}
    </div>
  )
}

export default App
