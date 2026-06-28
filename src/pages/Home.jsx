import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import PerspectivePicker from '../components/PerspectivePicker'
import OnboardingOverlay from '../components/OnboardingOverlay'
import BreakthroughToast from '../components/BreakthroughToast'
import './Home.css'

function Home() {
  const { setSelectedPerspectives, readCount } = useAppStore()
  const navigate = useNavigate()
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)

  const handlePerspectiveSelect = (perspectives, itemsCount = 20) => {
    setSelectedPerspectives(perspectives, itemsCount)
    navigate('/discover')
  }

  const handleOnboardingStart = () => {
    setShowOnboarding(false)
    setTimeout(() => {
      window.scrollTo({
        top: window.innerHeight * 0.6,
        behavior: 'smooth'
      })
    }, 200)
  }

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="home-page">
      {showOnboarding && <OnboardingOverlay onStart={handleOnboardingStart} />}

      <div className="home-hero">
        <div className="hero-brand">
          <span className="hero-diamond">◆</span>
          <h1 className="hero-title font-serif">棱 镜</h1>
          <span className="hero-diamond">◆</span>
        </div>
        <p className="hero-subtitle font-serif">— PRISM NEWS · 换个视角看世界 —</p>
        <p className="hero-tagline">抽取你的专属身份，打破信息茧房</p>
      </div>

      <PerspectivePicker
        onSelect={handlePerspectiveSelect}
        selectedPerspective={null}
      />

      <BreakthroughToast
        readCount={readCount}
        perspectives={null}
      />

      {showBackToTop && (
        <button
          className="back-to-top-btn"
          onClick={handleBackToTop}
          aria-label="回到顶部"
        >
          ↑
        </button>
      )}
    </div>
  )
}

export default Home
