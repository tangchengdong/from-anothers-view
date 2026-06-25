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
      <PerspectivePicker
        onSelect={handlePerspectiveSelect}
        selectedPerspective={null}
      />
    </div>
  )
}

export default Home
