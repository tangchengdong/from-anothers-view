import React, { useState, useEffect, useRef } from 'react'
import './OnboardingOverlay.css'

const kabeiUrl = new URL('../assets/characters/kabei.webp', import.meta.url).href

const PREVIEW_CARDS = {
  left: { name: '唐代诗人李白', src: `${import.meta.env.BASE_URL}cards/card_01_李白(1).webp` },
  right: { name: '外星观察者', src: `${import.meta.env.BASE_URL}cards/card_02_外星观察者(1).webp` },
  back: { name: '神秘身份', src: kabeiUrl }
}

function HeroCardTeaser({ onClick }) {
  return (
    <button
      className="hero-card-teaser"
      onClick={onClick}
      type="button"
      aria-label="点击抽取身份卡"
    >
      <span className="hero-card-slot is-left">
        <span className="hero-card-float">
          <img
            src={PREVIEW_CARDS.left.src}
            alt={PREVIEW_CARDS.left.name}
            className="hero-card-teaser-img"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            width="120"
            height="170"
          />
        </span>
      </span>
      <span className="hero-card-slot is-center">
        <span className="hero-card-float">
          <img
            src={PREVIEW_CARDS.back.src}
            alt={PREVIEW_CARDS.back.name}
            className="hero-card-teaser-img is-back"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            width="155"
            height="210"
          />
          <span className="card-shine-layer" />
        </span>
      </span>
      <span className="hero-card-slot is-right">
        <span className="hero-card-float">
          <img
            src={PREVIEW_CARDS.right.src}
            alt={PREVIEW_CARDS.right.name}
            className="hero-card-teaser-img"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            width="120"
            height="170"
          />
        </span>
      </span>
    </button>
  )
}

function CocoonBurst() {
  return (
    <div className="cocoon-burst">
      <div className="burst-core" />
      <div className="burst-ring" />
      <div className="burst-rays" />
    </div>
  )
}

function CocoonShards() {
  return (
    <div className="cocoon-shards">
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className="shard" />
      ))}
    </div>
  )
}

function OnboardingOverlay({ onStart, resetKey }) {
  const [phase, setPhase] = useState('initial')
  const [papersOpen, setPapersOpen] = useState(false)
  const [contentVisible] = useState(true)
  const [cardsVisible, setCardsVisible] = useState(false)
  const [actionVisible, setActionVisible] = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [doorBurst, setDoorBurst] = useState(false)
  const timersRef = useRef([])

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  const scheduleTimer = (fn, delay) => {
    const t = setTimeout(fn, delay)
    timersRef.current.push(t)
    return t
  }

  const runEntrance = () => {
    clearTimers()
    setPhase('initial')
    setCardsVisible(false)
    setActionVisible(false)
    setFooterVisible(false)
    setExiting(false)
    setPapersOpen(false)
    setDoorBurst(false)

    scheduleTimer(() => setPhase('masthead-reveal'), 50)
    scheduleTimer(() => setPhase('title-reveal'), 180)
    scheduleTimer(() => setCardsVisible(true), 320)
    scheduleTimer(() => setActionVisible(true), 480)
    scheduleTimer(() => setFooterVisible(true), 650)
  }

  useEffect(() => {
    runEntrance()
    return clearTimers
  }, [resetKey])

  const triggerExit = (delay) => {
    setDoorBurst(true)
    scheduleTimer(() => {
      setPapersOpen(true)
      setExiting(true)
    }, 100)
    scheduleTimer(() => {
      onStart?.()
    }, delay)
  }

  const handleStart = () => {
    if (exiting) return
    triggerExit(780)
  }

  const handleSkip = () => {
    if (exiting) return
    triggerExit(700)
  }

  return (
    <div className={`onboarding-container ${exiting ? 'exiting' : ''}`}>
      <div className="door-light-leak" />
      <CocoonShards />

      <div className={`paper-sheet sheet-left ${papersOpen ? 'open' : ''} ${doorBurst ? 'burst' : ''}`}>
        <div className="paper-content">
          <div className="paper-fold" />
        </div>
      </div>

      <div className={`paper-sheet sheet-right ${papersOpen ? 'open' : ''} ${doorBurst ? 'burst' : ''}`}>
        <div className="paper-content">
          <div className="paper-fold" />
        </div>
      </div>

      {exiting && <CocoonBurst />}

      <div className={`onboarding-content ${contentVisible ? 'visible' : ''} ${exiting ? 'fade-out' : ''}`}>
        <button className="skip-btn" onClick={handleSkip}>
          跳过
        </button>

        <div className={`newspaper-masthead ${phase === 'masthead-reveal' || phase === 'title-reveal' ? 'revealed' : ''}`}>
          <div className="masthead-line top-line" />
          <div className="masthead-title">
            <span className="masthead-ornament left">❖</span>
            <span className="masthead-name">破 茧 日 报</span>
            <span className="masthead-ornament right">❖</span>
          </div>
          <div className="masthead-subtitle">
            <span>PRISM DAILY · 第壹期</span>
            <span className="masthead-divider">|</span>
            <span>换个身份 · 换个世界</span>
          </div>
          <div className="masthead-line bottom-line">
            <div className="line-pattern" />
          </div>
        </div>

        <div className={`value-section ${phase === 'title-reveal' ? 'revealed' : ''}`}>
          <h1 className="core-value-line font-serif">
            同一条新闻，换一个身份，看到完全不同的世界。
          </h1>
          <p className="value-sub font-serif">
            打工人看到压力，诗人看到浪漫，外星人看到文明样本。
          </p>
        </div>

        <div className={`card-preview-section ${cardsVisible ? 'revealed' : ''}`}>
          <HeroCardTeaser onClick={handleStart} />
        </div>

        <div className={`action-section ${actionVisible ? 'revealed' : ''}`}>
          <button className="start-btn hero-primary-cta" onClick={handleStart}>
            <span className="btn-ornament">❖</span>
            <span className="btn-text">抽取我的今日身份</span>
            <span className="btn-ornament">❖</span>
          </button>
          <p className="hint-text">
            3 秒获得一个全新视角，可重抽、可五连抽
          </p>
        </div>

        <div className={`newspaper-footer ${footerVisible ? 'revealed' : ''}`}>
          <div className="footer-line" />
          <div className="footer-info">
            <span>本报今日版</span>
            <span>·</span>
            <span>共捌版</span>
            <span>·</span>
            <span>零售价：一文钱</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingOverlay
