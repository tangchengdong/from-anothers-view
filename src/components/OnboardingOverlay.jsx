import React, { useState, useEffect } from 'react'
import './OnboardingOverlay.css'

const ONBOARDING_KEY = 'prism-onboarding-done'

function OnboardingOverlay({ onStart }) {
  const [phase, setPhase] = useState('initial')
  const [doorsOpen, setDoorsOpen] = useState(false)
  const [contentVisible, setContentVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('logo-reveal'), 300)
    const timer2 = setTimeout(() => setPhase('title-reveal'), 900)
    const timer3 = setTimeout(() => setPhase('content-reveal'), 1500)
    const timer4 = setTimeout(() => setContentVisible(true), 1800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [])

  const handleStart = () => {
    setDoorsOpen(true)
    setExiting(true)

    setTimeout(() => {
      onStart?.()
    }, 1800)
  }

  const handleSkip = () => {
    setDoorsOpen(true)
    setExiting(true)
    setTimeout(() => {
      onStart?.()
    }, 1800)
  }

  return (
    <div className={`onboarding-container ${exiting ? 'exiting' : ''}`}>
      <div className={`door door-left ${doorsOpen ? 'open' : ''}`}>
        <div className="door-inner">
          <div className="door-pattern" />
          <div className="door-frame" />
        </div>
      </div>

      <div className={`door door-right ${doorsOpen ? 'open' : ''}`}>
        <div className="door-inner">
          <div className="door-pattern" />
          <div className="door-frame" />
        </div>
      </div>

      <div className="door-seam">
        <div className="seam-glow" />
      </div>

      <div className={`onboarding-content ${contentVisible ? 'visible' : ''} ${exiting ? 'fade-out' : ''}`}>
        <button className="skip-btn" onClick={handleSkip}>
          跳过
        </button>

        <div className={`prism-logo ${phase === 'logo-reveal' || phase === 'title-reveal' || phase === 'content-reveal' ? 'revealed' : ''}`}>
          <div className="prism-glow">
            <div className="glow-ring ring-1" />
            <div className="glow-ring ring-2" />
            <div className="glow-ring ring-3" />
          </div>
          <div className="prism-icon">
            <span className="prism-diamond">◈</span>
          </div>
          <div className="light-rays">
            <div className="ray ray-1" />
            <div className="ray ray-2" />
            <div className="ray ray-3" />
            <div className="ray ray-4" />
            <div className="ray ray-5" />
          </div>
        </div>

        <div className={`title-section ${phase === 'title-reveal' || phase === 'content-reveal' ? 'revealed' : ''}`}>
          <div className="title-badge">
            <span className="badge-dot" />
            破茧者计划
          </div>
          <h1 className="main-title">
            <span className="title-text">破茧者计划</span>
          </h1>
          <p className="subtitle">
            换个身份，换个世界
          </p>
        </div>

        <div className={`desc-section ${phase === 'content-reveal' ? 'revealed' : ''}`}>
          <div className="divider-line">
            <span className="divider-diamond">◆</span>
          </div>
          <p className="description">
            同一条新闻，打工人看到压力，诗人看到浪漫，外星人看到文明样本。
            <br />
            抽一张身份卡，体验一个完全不同的视角。
          </p>
        </div>

        <div className={`action-section ${phase === 'content-reveal' ? 'revealed' : ''}`}>
          <button className="start-btn" onClick={handleStart}>
            <span className="btn-icon">◈</span>
            <span className="btn-text">推开这扇门 · 开始破茧</span>
            <span className="btn-arrow">→</span>
          </button>
          <p className="hint-text">
            五连抽可同时体验五个身份的观点碰撞
          </p>
        </div>
      </div>

      <div className={`background-scene ${doorsOpen ? 'visible' : ''}`}>
        <div className="scene-layer layer-1" />
        <div className="scene-layer layer-2" />
        <div className="scene-layer layer-3" />
      </div>
    </div>
  )
}

export default OnboardingOverlay
