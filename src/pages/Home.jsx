import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import Hero from '../components/Hero'
import PerspectivePicker from '../components/PerspectivePicker'
import './Home.css'

function Home() {
  const { setSelectedPerspectives } = useAppStore()
  const navigate = useNavigate()
  const [showPicker, setShowPicker] = useState(true)

  const handlePerspectiveSelect = (perspectives, itemsCount = 20) => {
    setSelectedPerspectives(perspectives, itemsCount)
    navigate('/discover')
  }

  return (
    <div className="home-page">
      <Hero visible={true} />
      
      <div className="picker-wrapper">
        <PerspectivePicker
          onSelect={handlePerspectiveSelect}
          selectedPerspective={null}
        />
      </div>
    </div>
  )
}

export default Home
