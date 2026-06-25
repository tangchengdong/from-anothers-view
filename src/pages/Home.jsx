import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import PerspectivePicker from '../components/PerspectivePicker'
import OnboardingOverlay from '../components/OnboardingOverlay'
import './Home.css'

function Home() {
  const { setSelectedPerspectives } = useAppStore()
  const navigate = useNavigate()

  const handlePerspectiveSelect = (perspectives, itemsCount = 20) => {
    setSelectedPerspectives(perspectives, itemsCount)
    navigate('/discover')
  }

  return (
    <div className="home-page">
      <OnboardingOverlay />

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
    </div>
  )
}

export default Home
