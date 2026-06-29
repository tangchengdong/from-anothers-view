import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_ROLES, getCardImagePath, getLocalImagePath } from '../mock/data'
import PrismRoundtable from '../components/PrismRoundtable'
import './MindPalace.css'

function CharacterAvatar({ role, className = '' }) {
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0)
  const [showEmoji, setShowEmoji] = useState(false)

  const sources = []
  if (role.card_image) {
    sources.push({ url: getCardImagePath(role.card_image), type: 'card' })
  }
  if (role.local_image) {
    sources.push({ url: getLocalImagePath(role.local_image), type: 'local' })
  }

  if (showEmoji || sources.length === 0) {
    return <div className={`${className} emoji-fallback`}>{role.emoji || '?'}</div>
  }

  const handleError = () => {
    if (currentSrcIndex < sources.length - 1) {
      setCurrentSrcIndex(currentSrcIndex + 1)
    } else {
      setShowEmoji(true)
    }
  }

  return (
    <img
      src={sources[currentSrcIndex].url}
      alt={role.name}
      className={className}
      onError={handleError}
    />
  )
}

const THOUGHT_DIMENSIONS = [
  { id: 'insight', label: '洞察力', desc: '透过现象看本质的能力', icon: '◈', angle: -90, color: '#00ffff' },
  { id: 'empathy', label: '共情力', desc: '理解他人情感的能力', icon: '❖', angle: -30, color: '#ff66cc' },
  { id: 'logic', label: '批判力', desc: '理性分析与判断', icon: '✦', angle: 30, color: '#ffaa00' },
  { id: 'breadth', label: '信息广度', desc: '知识涉猎的范围', icon: '✧', angle: 90, color: '#00ff88' },
  { id: 'interest', label: '趣味性', desc: '观点的有趣程度', icon: '❋', angle: 150, color: '#ff4488' },
  { id: 'wisdom', label: '处世智慧', desc: '人生经验与哲学', icon: '◆', angle: 210, color: '#aa88ff' }
]

function EnhancedMindMap({ role, isActive }) {
  const [selectedNode, setSelectedNode] = useState(null)
  const [time, setTime] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const animRef = useRef(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!isActive) return
    let lastTime = performance.now()
    const animate = (t) => {
      const delta = (t - lastTime) / 1000
      lastTime = t
      setTime(prev => prev + delta)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [isActive])

  useEffect(() => { setSelectedNode(null) }, [role])

  if (!isActive) return null

  const getAttr = (id) => {
    if (!role.attributes) return 75
    const map = {
      insight: role.attributes.insight || role.attributes['洞察力'],
      empathy: role.attributes.empathy || role.attributes['共情力'],
      logic: role.attributes.logic || role.attributes['批判力'],
      breadth: role.attributes.breadth || role.attributes['信息广度'],
      interest: role.attributes.interest || role.attributes['趣味性'],
      wisdom: 70 + Math.floor(Math.random() * 20)
    }
    return map[id] || 70
  }

  const getDesc = (node) => {
    const map = {
      insight: `${role.name}善于从纷繁复杂的表象中抓住问题核心，目光如炬。`,
      empathy: `${role.name}能深切体会他人的喜怒哀乐，情感世界细腻而丰富。`,
      logic: `${role.name}思考问题条理清晰，总能从多角度提出质疑与见解。`,
      breadth: `${role.name}涉猎广泛，对各种领域都有所了解，视野开阔。`,
      interest: `与${role.name}交谈从不会乏味，其谈吐风趣，观点新颖。`,
      wisdom: `${role.name}历经世事，有着自己独特的人生哲学与处世之道。`
    }
    return map[node.id]
  }

  const radius = isMobile ? 110 : 170
  const centerX = 50
  const centerY = 50

  const nodes = THOUGHT_DIMENSIONS.map((node, idx) => {
    const rad = (node.angle + time * 0.6) * (Math.PI / 180)
    const wobble = Math.sin(time * 0.6 + idx * 1.2) * 8
    const r = radius + wobble
    const x = centerX + Math.cos(rad) * (r / (isMobile ? 3.2 : 5))
    const y = centerY + Math.sin(rad) * (r / (isMobile ? 3.2 : 4.5))
    const breathe = 1 + Math.sin(time * 1.2 + idx * 0.8) * 0.1
    return { ...node, x, y, breathe, val: getAttr(node.id) }
  })

  const selected = selectedNode ? nodes.find(n => n.id === selectedNode) : null

  return (
    <div className="palace-mind-container active">
      <div className="palace-inner-frame">
        {/* Corner decorations */}
        <div className="palace-corner corner-tl" />
        <div className="palace-corner corner-tr" />
        <div className="palace-corner corner-bl" />
        <div className="palace-corner corner-br" />

        {/* SVG connection lines */}
        <svg className="mind-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {nodes.map((n) => (
              <linearGradient key={`grad-${n.id}`} id={`line-grad-${n.id}`} x1="50%" y1="50%" x2={`${n.x}%`} y2={`${n.y}%`}>
                <stop offset="0%" stopColor="#00ffff" stopOpacity="0.6" />
                <stop offset="100%" stopColor={n.color} stopOpacity="0.8" />
              </linearGradient>
            ))}
          </defs>

          {/* Connection lines */}
          {nodes.map((n) => (
            <line
              key={`line-${n.id}`}
              x1={centerX} y1={centerY}
              x2={n.x} y2={n.y}
              stroke={`url(#line-grad-${n.id})`}
              strokeWidth={selectedNode === n.id ? "0.5" : "0.2"}
              strokeDasharray={selectedNode === n.id ? "none" : "1 0.8"}
              filter="url(#glow)"
              className="mind-line"
            />
          ))}

          {/* Orbital ring */}
          <circle
            cx={centerX} cy={centerY}
            r={radius / (isMobile ? 3.2 : 4.8)}
            fill="none"
            stroke="rgba(0,255,255,0.08)"
            strokeWidth="0.3"
            strokeDasharray="2 2"
          />
          <circle
            cx={centerX} cy={centerY}
            r={radius / (isMobile ? 2.2 : 3.2)}
            fill="none"
            stroke="rgba(255,0,255,0.06)"
            strokeWidth="0.2"
            strokeDasharray="3 3"
            className="orbit-ring-2"
          />

          {/* Data particles on lines */}
          {nodes.map((n, i) => {
            const progress = ((time * 0.3 + i * 0.15) % 1)
            const px = centerX + (n.x - centerX) * progress
            const py = centerY + (n.y - centerY) * progress
            return (
              <circle
                key={`particle-${n.id}`}
                cx={px} cy={py}
                r="0.5"
                fill={n.color}
                opacity={0.6 + Math.sin(time * 3 + i) * 0.3}
                filter="url(#glow)"
              />
            )
          })}
        </svg>

        {/* Center character */}
        <div className="mind-center">
          <div className="mind-halo" />
          <div className="mind-portrait-frame" style={{ transform: `scale(${1 + Math.sin(time * 0.8) * 0.04})` }}>
            <CharacterAvatar role={role} className="mind-portrait" />
          </div>
          <div className="mind-pulse-ring" />
          <div className="mind-name-tag">
            <h3 className="mind-role-name">{role.name}</h3>
            <p className="mind-subtitle">思维图谱 · NEURAL MAP</p>
          </div>
        </div>

        {/* Orb nodes */}
        {nodes.map((node) => {
          const isSel = selectedNode === node.id
          return (
            <div
              key={node.id}
              className={`mind-orb ${isSel ? 'selected' : ''}`}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: `translate(-50%, -50%) scale(${node.breathe})`,
                '--orb-color': node.color
              }}
              onClick={() => setSelectedNode(isSel ? null : node.id)}
              onTouchEnd={(e) => { e.preventDefault(); setSelectedNode(isSel ? null : node.id) }}
              role="button"
              tabIndex={0}
            >
              <div className="orb-glow" />
              <div className="orb-core">
                <span className="orb-icon">{node.icon}</span>
              </div>
              <div className="orb-ring-pulse" />
              <span className="orb-label">{node.label}</span>
            </div>
          )
        })}

        {/* Detail card */}
        {selected && (
          <div className="mind-detail-card" style={{ '--card-color': selected.color }}>
            <div className="mind-detail-header">
              <span className="mind-detail-icon" style={{ color: selected.color }}>{selected.icon}</span>
              <h4 className="mind-detail-title">{selected.label}</h4>
              <div className="mind-detail-bar">
                <div className="mind-detail-fill" style={{ width: `${selected.val}%`, background: `linear-gradient(90deg, ${selected.color}, #00ffff)` }} />
              </div>
              <span className="mind-detail-val" style={{ color: selected.color }}>{selected.val}</span>
              <button className="mind-detail-close" onClick={() => setSelectedNode(null)}>✕</button>
            </div>
            <p className="mind-detail-desc">{selected.desc}</p>
            <p className="mind-detail-text">{getDesc(selected)}</p>
          </div>
        )}

        <div className="palace-epigraph">
          <span className="epigraph-rule" />
          <span className="epigraph-text">思 维 如 光 ， 照 见 内 心</span>
          <span className="epigraph-rule" />
        </div>
      </div>
    </div>
  )
}

export default function MindPalace() {
  const navigate = useNavigate()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showRoundtable, setShowRoundtable] = useState(false)
  const displayRoles = MOCK_ROLES.slice(0, 12)

  const handleTabAction = (tab) => {
    if (tab === 'debate') {
      window.dispatchEvent(new CustomEvent('open-debate-room'))
      return
    }
    if (tab === 'discuss') {
      setShowRoundtable(true)
    }
  }

  return (
    <div className="mind-palace-page">
      <div className="palace-masthead">
        <button className="back-home" onClick={() => navigate('/')}>
          ← 返回主页
        </button>
        <div className="masthead-center">
          <div className="title-ornament">
            <span className="ornament-line" />
            <span className="ornament-diamond">◆</span>
            <span className="ornament-line" />
          </div>
          <h1 className="palace-name">思 维 殿 堂</h1>
          <p className="palace-slogan">MIND PALACE · 神经连接 · 思维可视化</p>
          <div className="title-ornament">
            <span className="ornament-line" />
            <span className="ornament-diamond">◆</span>
            <span className="ornament-line" />
          </div>
        </div>
        <div className="palace-tabs">
          <button
            className="palace-tab debate"
            onClick={() => handleTabAction('debate')}
          >
            ⚔️ 辩论室
          </button>
          <button
            className="palace-tab roundtable"
            onClick={() => handleTabAction('discuss')}
          >
            🍵 茶话会
          </button>
        </div>
      </div>

      <div className="palace-body">
        <div className="characters-gallery">
          <div className="gallery-title">
            <span className="title-rule" />
            <span>人 物 志</span>
            <span className="title-rule" />
          </div>
          <div className="gallery-scroll">
            {displayRoles.map((role, index) => {
              const isSelected = selectedIndex === index
              return (
                <div
                  key={role.name}
                  className={`character-card ${isSelected ? 'chosen' : ''}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <div className="card-frame">
                    <CharacterAvatar role={role} className="card-portrait" />
                    {isSelected && <div className="card-selected-glow" />}
                  </div>
                  <div className="card-caption">{role.name}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="palace-stage">
          <div className="stage-map">
            <div className="stage-heading">
              <span className="heading-deco">◈</span>
              <h2 className="heading-text">思 维 图 谱</h2>
              <span className="heading-deco">◈</span>
            </div>
            <p className="stage-hint">悬停思维节点，洞察人物维度 · 点击节点查看详情</p>
            <div className="map-canvas">
              {displayRoles.map((role, index) => (
                <EnhancedMindMap
                  key={role.name}
                  role={role}
                  isActive={selectedIndex === index}
                />
              ))}
            </div>
            <div className="palace-chat-entry">
              <button className="palace-chat-btn" onClick={() => setShowRoundtable(true)}>
                <span className="chat-btn-icon">🍵</span>
                <span className="chat-btn-text">进入茶话会 · 开启多角色讨论</span>
                <span className="chat-btn-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRoundtable && (
        <PrismRoundtable onClose={() => setShowRoundtable(false)} />
      )}
    </div>
  )
}
