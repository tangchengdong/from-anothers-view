import React, { useState, useEffect, useRef, useCallback } from 'react'
import './OnboardingOverlay.css'

const kabeiUrl = new URL('../assets/characters/kabei.webp', import.meta.url).href

const PREVIEW_CARDS = {
  left: { name: '唐代诗人李白', src: `${import.meta.env.BASE_URL}cards/card_01_李白(1).webp` },
  right: { name: '外星观察者', src: `${import.meta.env.BASE_URL}cards/card_02_外星观察者(1).webp` },
  back: { name: '神秘身份', src: kabeiUrl }
}

function generateShards(count = 16) {
  const shards = []
  for (let i = 0; i < count; i++) {
    const angleDeg = (360 / count) * i + (Math.random() * 20 - 10)
    const angleRad = (angleDeg * Math.PI) / 180
    const dist = 250 + Math.random() * 450
    const size = 12 + Math.random() * 30
    const rot = Math.random() * 720 - 360
    const delay = Math.random() * 80
    const tx = Math.cos(angleRad) * dist
    const ty = Math.sin(angleRad) * dist
    shards.push({ size, rot, delay, tx, ty, id: i })
  }
  return shards
}

function GlassShards({ bursting }) {
  const [shards] = useState(() => generateShards(16))
  return (
    <div className={`glass-shards ${bursting ? 'bursting' : ''}`}>
      {shards.map(s => (
        <div
          key={s.id}
          className="glass-shard"
          style={{
            '--shard-tx': `${s.tx}px`,
            '--shard-ty': `${s.ty}px`,
            '--shard-size': `${s.size}px`,
            '--shard-rot': `${s.rot}deg`,
            '--shard-delay': `${s.delay}ms`,
          }}
        />
      ))}
    </div>
  )
}

function CrackLines({ bursting }) {
  return (
    <div className={`crack-overlay ${bursting ? 'visible' : ''}`}>
      <svg className="crack-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="crackGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g className="crack-lines" filter="url(#crackGlow)">
          <path d="M500,500 L480,420 L440,380 L400,300 L350,220" className="crack-path" style={{ '--cd': '0ms' }} />
          <path d="M500,500 L530,430 L580,370 L640,290 L700,200" className="crack-path" style={{ '--cd': '50ms' }} />
          <path d="M500,500 L560,460 L620,480 L700,460 L780,420" className="crack-path" style={{ '--cd': '100ms' }} />
          <path d="M500,500 L460,540 L400,580 L320,620 L240,680" className="crack-path" style={{ '--cd': '150ms' }} />
          <path d="M500,500 L520,560 L560,620 L600,700 L650,780" className="crack-path" style={{ '--cd': '200ms' }} />
          <path d="M500,500 L440,480 L360,440 L280,400 L180,360" className="crack-path" style={{ '--cd': '80ms' }} />
          <path d="M500,500 L510,570 L480,640 L440,720 L400,800" className="crack-path" style={{ '--cd': '180ms' }} />
          <path d="M500,500 L460,400 L420,460 L380,500 L320,520" className="crack-branch" style={{ '--cd': '120ms' }} />
          <path d="M500,500 L550,420 L600,450 L660,430 L720,400" className="crack-branch" style={{ '--cd': '160ms' }} />
          <path d="M500,500 L450,560 L400,530 L350,570 L280,560" className="crack-branch" style={{ '--cd': '220ms' }} />
          <circle cx="500" cy="500" r="60" className="crack-impact" />
          <circle cx="500" cy="500" r="30" className="crack-impact-inner" />
        </g>
      </svg>
    </div>
  )
}

function ShockWaves({ bursting }) {
  return (
    <div className={`shock-waves ${bursting ? 'active' : ''}`}>
      <div className="shock-wave wave-1" />
      <div className="shock-wave wave-2" />
      <div className="shock-wave wave-3" />
      <div className="shock-flash" />
    </div>
  )
}

function HeroCardTeaser({ onClick }) {
  return (
    <button
      className="cyber-card-teaser"
      onClick={onClick}
      type="button"
      aria-label="点击抽取身份卡"
    >
      <span className="cyber-card-slot is-left">
        <img
          src={PREVIEW_CARDS.left.src}
          alt={PREVIEW_CARDS.left.name}
          className="cyber-card-teaser-img"
          loading="eager"
          decoding="async"
          width="100"
          height="140"
        />
      </span>
      <span className="cyber-card-slot is-center">
        <img
          src={PREVIEW_CARDS.back.src}
          alt={PREVIEW_CARDS.back.name}
          className="cyber-card-teaser-img is-back"
          loading="eager"
          decoding="async"
          width="130"
          height="178"
        />
      </span>
      <span className="cyber-card-slot is-right">
        <img
          src={PREVIEW_CARDS.right.src}
          alt={PREVIEW_CARDS.right.name}
          className="cyber-card-teaser-img"
          loading="eager"
          decoding="async"
          width="100"
          height="140"
        />
      </span>
    </button>
  )
}

function CyberParticles() {
  return (
    <div className="cyber-particles">
      {Array.from({ length: 20 }).map((_, i) => (
        <span key={i} className="cyber-particle" />
      ))}
    </div>
  )
}

function CodeRain() {
  const CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン<>{}[];=+*/#@$%&'
  const COLUMNS = 16
  const [columns] = useState(() => {
    const cols = []
    for (let i = 0; i < COLUMNS; i++) {
      const chars = []
      const len = 8 + Math.floor(Math.random() * 12)
      for (let j = 0; j < len; j++) {
        chars.push(CHARS[Math.floor(Math.random() * CHARS.length)])
      }
      cols.push({
        chars,
        left: (i / COLUMNS) * 100 + Math.random() * 3,
        duration: 8 + Math.random() * 12,
        delay: Math.random() * 5,
        fontSize: 10 + Math.floor(Math.random() * 6),
      })
    }
    return cols
  })

  return (
    <div className="code-rain">
      {columns.map((col, i) => (
        <div
          key={i}
          className={`code-column code-col-${i % 4}`}
          style={{
            left: `${col.left}%`,
            animationDuration: `${col.duration}s`,
            animationDelay: `${col.delay}s`,
            fontSize: `${col.fontSize}px`,
          }}
        >
          {col.chars.map((ch, j) => (
            <span key={j} className={`code-char ${j === 0 ? 'code-head' : ''}`} style={{ animationDelay: `${j * 0.08}s` }}>
              {ch}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

function BootSequence({ phase }) {
  const lines = [
    { text: '> PRISM OS v2.0.77', delay: 0 },
    { text: '> initializing quantum identity matrix...', delay: 100 },
    { text: '> [OK] connecting to multi-perspective database', delay: 240 },
    { text: '> [OK] loading neural interface module', delay: 380 },
    { text: '> [OK] bypassing information cocoon firewall', delay: 520 },
    { text: '> [OK] cocoon_break.exe --protocol v7', delay: 660 },
    { text: '> status: READY | waiting for signature...', delay: 800 }
  ]

  return (
    <div className={`cyber-boot ${phase >= 'boot' ? 'visible' : ''}`}>
      {lines.map((line, i) => (
        <div key={i} className="cyber-boot-line" style={{ animationDelay: `${line.delay}ms` }}>
          <span className="cyber-boot-text typewriter" style={{ '--char-count': line.text.length }}>{line.text}</span>
          <span className="cyber-boot-cursor">_</span>
        </div>
      ))}
    </div>
  )
}

function OnboardingOverlay({ onStart, resetKey }) {
  const [phase, setPhase] = useState('initial')
  const [cardsVisible, setCardsVisible] = useState(false)
  const [actionVisible, setActionVisible] = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [bursting, setBursting] = useState(false)
  const [doorsOpen, setDoorsOpen] = useState(false)
  const [glassCracked, setGlassCracked] = useState(false)
  const contentRef = useRef(null)
  const timersRef = useRef([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const scheduleTimer = useCallback((fn, delay) => {
    const t = setTimeout(fn, delay)
    timersRef.current.push(t)
    return t
  }, [])

  const runEntrance = useCallback(() => {
    clearTimers()
    setPhase('initial')
    setCardsVisible(false)
    setActionVisible(false)
    setFooterVisible(false)
    setExiting(false)
    setBursting(false)
    setDoorsOpen(false)
    setGlassCracked(false)

    scheduleTimer(() => setPhase('boot'), 50)
    scheduleTimer(() => setPhase('title-reveal'), 700)
    scheduleTimer(() => setCardsVisible(true), 1000)
    scheduleTimer(() => setActionVisible(true), 1300)
    scheduleTimer(() => setFooterVisible(true), 1600)
  }, [clearTimers, scheduleTimer])

  useEffect(() => {
    runEntrance()
    return clearTimers
  }, [resetKey, runEntrance, clearTimers])

  const handleStart = useCallback(() => {
    if (exiting) return
    setGlassCracked(true)
    scheduleTimer(() => {
      setBursting(true)
    }, 300)
    scheduleTimer(() => {
      setDoorsOpen(true)
      setExiting(true)
    }, 600)
    scheduleTimer(() => {
      onStart?.()
    }, 1200)
  }, [exiting, onStart, scheduleTimer])

  const handleSkip = useCallback(() => {
    if (exiting) return
    setBursting(true)
    setDoorsOpen(true)
    setExiting(true)
    scheduleTimer(() => {
      onStart?.()
    }, 800)
  }, [exiting, onStart, scheduleTimer])

  return (
    <div className={`cyber-onboarding ${exiting ? 'exiting' : ''}`}>
      <div className="cyber-grid-bg" />
      <div className="cyber-scanlines" />
      <div className="cyber-vignette" />
      <CyberParticles />
      <CodeRain />

      <div className="cyber-glass-surface">
        <div className={`cyber-gate gate-left ${doorsOpen ? 'open' : ''}`}>
          <div className="cyber-gate-inner">
            <div className="cyber-gate-edge" />
            <div className="cyber-gate-corner tl" />
            <div className="cyber-gate-corner bl" />
            <div className="cyber-gate-hologram">
              <div className="hologram-barcode" />
            </div>
          </div>
        </div>

        <div className={`cyber-gate gate-right ${doorsOpen ? 'open' : ''}`}>
          <div className="cyber-gate-inner">
            <div className="cyber-gate-edge" />
            <div className="cyber-gate-corner tr" />
            <div className="cyber-gate-corner br" />
            <div className="cyber-gate-hologram">
              <div className="hologram-barcode" />
            </div>
          </div>
        </div>

        <CrackLines bursting={glassCracked || bursting} />
        <ShockWaves bursting={bursting} />
        <GlassShards bursting={bursting} />
      </div>

      <div ref={contentRef} className={`cyber-onboarding-content ${exiting ? 'fade-out' : ''}`}>
        <button className="cyber-skip-btn" onClick={handleSkip} aria-label="跳过引导">
          [ SKIP ]
        </button>

        <div className="cyber-header-bar">
          <span className="cyber-header-tag pulse-glow">◈ PRISM OS</span>
          <span className="cyber-header-status">
            <span className="cyber-status-dot" />
            SYSTEM ONLINE
          </span>
        </div>

        <BootSequence phase={phase} />

        <div className={`cyber-title-block ${phase === 'title-reveal' || cardsVisible ? 'revealed' : ''}`}>
          <div className="cyber-title-decoration">
            <span className="cyber-deco-line" />
            <span className="cyber-deco-diamond">◆</span>
            <span className="cyber-deco-line" />
          </div>
          <h1 className="cyber-main-title">
            <span className="cyber-title-line-1">换个视角</span>
            <span className="cyber-title-line-2 cyber-gradient-text">看世界</span>
          </h1>
          <p className="cyber-subtitle">
            同一条新闻，换一个身份，看到完全不同的世界。
          </p>
          <p className="cyber-subtitle-muted">
            打工人看到压力 · 诗人看到浪漫 · 外星人看到文明样本
          </p>
          <div className="cyber-title-decoration">
            <span className="cyber-deco-line" />
            <span className="cyber-deco-diamond">◇</span>
            <span className="cyber-deco-line" />
          </div>
        </div>

        <div className={`cyber-cards-section ${cardsVisible ? 'revealed' : ''}`}>
          <HeroCardTeaser onClick={handleStart} />
        </div>

        <div className={`cyber-action-section ${actionVisible ? 'revealed' : ''}`}>
          <button className="cyber-btn primary cyber-cta-btn" onClick={handleStart}>
            <span className="cyber-btn-bracket">[</span>
            <span className="cyber-btn-icon">◈</span>
            <span className="cyber-btn-text">签署棱镜协议</span>
            <span className="cyber-btn-bracket">]</span>
            <span className="cyber-btn-shine" />
          </button>
          <p className="cyber-hint-text">
            3秒获得一个全新视角 &nbsp;◈&nbsp; 可重抽 &nbsp;◈&nbsp; 可五连抽
          </p>
        </div>

        <div className={`cyber-footer-bar ${footerVisible ? 'revealed' : ''}`}>
          <span className="cyber-footer-item font-mono">NODE: PRISM-{(resetKey || 0).toString().padStart(4, '0')}</span>
          <span className="cyber-footer-sep">|</span>
          <span className="cyber-footer-item font-mono">PROTOCOL: COCOON.v7</span>
          <span className="cyber-footer-sep">|</span>
          <span className="cyber-footer-item font-mono">STATUS: READY</span>
        </div>
      </div>
    </div>
  )
}

export default OnboardingOverlay
