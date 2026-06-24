import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import Header from './components/Header'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Discover from './pages/Discover'
import Login from './pages/Login'
import Register from './pages/Register'
import ContentDetail from './pages/ContentDetail'
import SearchResults from './pages/SearchResults'
import Profile from './pages/Profile'
import './App.css'

function App() {
  const { selectedPerspectives } = useAppStore()

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={
            selectedPerspectives && selectedPerspectives.length > 0 ? <Navigate to="/discover" replace /> : <Home />
          } />
          <Route path="/discover" element={
            !selectedPerspectives || selectedPerspectives.length === 0 ? <Navigate to="/" replace /> : <Discover />
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/content/:id" element={<ContentDetail />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App