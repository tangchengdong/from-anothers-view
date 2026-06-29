import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import PerspectivePicker from '../components/PerspectivePicker'
import OnboardingOverlay from '../components/OnboardingOverlay'
import BreakthroughToast from '../components/BreakthroughToast'
import './Home.css'

const RESET_ONBOARDING_EVENT = 'prism-reset-onboarding'

function Home() {
  const { setSelectedPerspectives, readCount, resetSelection } = useAppStore()
  const navigate = useNavigate()
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [onboardingKey, setOnboardingKey] = useState(0)
  const [pageEntered, setPageEntered] = useState(false)

  useEffect(() => {
    const handleReset = () => {
      window.scrollTo({ top: 0, behavior: 'auto' })
      resetSelection()
      setShowOnboarding(true)
      setPageEntered(false)
      setOnboardingKey(k => k + 1)
    }
    window.addEventListener(RESET_ONBOARDING_EVENT, handleReset)
    return () => window.removeEventListener(RESET_ONBOARDING_EVENT, handleReset)
  }, [resetSelection])

  const handlePerspectiveSelect = (perspectives, itemsCount = 20) => {
    setSelectedPerspectives(perspectives, itemsCount)
    navigate('/discover')
  }

  const handleOnboardingStart = () => {
    setShowOnboarding(false)
    setPageEntered(true)
    setTimeout(() => {
      const quickPickTitle = document.querySelector('.picker-section-title')
      if (quickPickTitle) {
        const rect = quickPickTitle.getBoundingClientRect()
        const headerHeight = 60
        const offset = rect.top + window.scrollY - headerHeight
        window.scrollTo({
          top: offset,
          behavior: 'smooth'
        })
        quickPickTitle.classList.add('section-highlight')
        setTimeout(() => quickPickTitle.classList.remove('section-highlight'), 2000)
      } else {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }
    }, 450)
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
    <div className={`home-page ${pageEntered ? 'entered' : ''}`}>
      {showOnboarding && <OnboardingOverlay key={onboardingKey} onStart={handleOnboardingStart} />}

      <div className="home-hero">
        <div className="hero-cyber-corner tl" />
        <div className="hero-cyber-corner tr" />
        <div className="hero-cyber-corner bl" />
        <div className="hero-cyber-corner br" />
        <div className="hero-scan-line" />
        <div className="hero-brand">
          <span className="hero-diamond">◆</span>
          <h1 className="hero-title">棱 镜</h1>
          <span className="hero-diamond">◆</span>
        </div>
        <p className="hero-subtitle">— PRISM NEWS · 换个视角看世界 —</p>
        <p className="hero-tagline">抽取你的专属身份，打破信息茧房</p>
        <div className="hero-particles">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className={`hero-particle hp-${i}`} />
          ))}
        </div>
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
export { RESET_ONBOARDING_EVENT }
