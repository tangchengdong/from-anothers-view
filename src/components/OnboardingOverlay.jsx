import React, { useState, useEffect } from 'react'
import './OnboardingOverlay.css'

const ONBOARDING_KEY = 'prism-onboarding-done'

function OnboardingOverlay({ onStart }) {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 400)
    setTimeout(() => setEntered(true), 500)
  }, [])

  const handleStart = () => {
    setClosing(true)
    setTimeout(() => {
      setVisible(false)
      setClosing(false)
      onStart?.()
    }, 500)
  }

  const handleSkip = () => {
    handleStart()
  }

  if (!visible) return null

  return (
    <div className={`cocoon-overlay ${closing ? 'closing' : ''}`}>
      <div className={`cocoon-modal ${entered ? 'entered' : ''}`}>
        <button className="cocoon-skip" onClick={handleSkip}>
          直接浏览
        </button>

        <div className="cocoon-icon-area">
          <div className="cocoon-prism">
            <span className="prism-core">◈</span>
          </div>
        </div>

        <div className="cocoon-badge">
          <span className="cocoon-badge-dot" />
          破茧者计划
        </div>

        <h1 className="cocoon-main-title">
          破茧者计划
        </h1>
        <p className="cocoon-subtitle">
          换个身份，换个世界
        </p>

        <div className="cocoon-divider" />

        <p className="cocoon-desc">
          同一条新闻，打工人看到压力，诗人看到浪漫，外星人看到文明样本。
          抽一张身份卡，体验一个完全不同的视角。
        </p>

        <button className="cocoon-start-btn" onClick={handleStart}>
          <span>◈</span>
          <span>开始破茧 · 抽取身份</span>
          <span>→</span>
        </button>

        <p className="cocoon-hint">五连抽可同时体验五个身份的观点碰撞</p>
      </div>
    </div>
  )
}

export default OnboardingOverlay
