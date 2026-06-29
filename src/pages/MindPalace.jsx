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
  { id: 'insight', label: '洞察力', desc: '透过现象看本质的能力', icon: '◈', angle: -90, distance: 160, floatPhase: 0 },
  { id: 'empathy', label: '共情力', desc: '理解他人情感的能力', icon: '❖', angle: -30, distance: 175, floatPhase: 1.2 },
  { id: 'logic', label: '批判力', desc: '理性分析与判断', icon: '✦', angle: 30, distance: 165, floatPhase: 2.4 },
  { id: 'breadth', label: '信息广度', desc: '知识涉猎的范围', icon: '✧', angle: 90, distance: 150, floatPhase: 3.6 },
  { id: 'interest', label: '趣味性', desc: '观点的有趣程度', icon: '❋', angle: 150, distance: 175, floatPhase: 4.8 },
  { id: 'wisdom', label: '处世智慧', desc: '人生经验与哲学', icon: '◆', angle: 210, distance: 160, floatPhase: 5.5 }
]

function PalaceMindMap({ role, isActive }) {
  const [hoveredNode, setHoveredNode] = useState(null)
  const [time, setTime] = useState(0)
  const animRef = useRef(null)

  useEffect(() => {
    if (!isActive) return

    let lastTime = performance.now()
    const animate = (currentTime) => {
      const delta = (currentTime - lastTime) / 1000
      lastTime = currentTime
      setTime(prev => prev + delta)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [isActive])

  if (!isActive) return null

  const getThoughtContent = (node) => {
    const thoughts = {
      insight: `${role.name}善于从纷繁复杂的表象中抓住问题核心，目光如炬。`,
      empathy: `${role.name}能深切体会他人的喜怒哀乐，情感世界细腻而丰富。`,
      logic: `${role.name}思考问题条理清晰，总能从多角度提出质疑与见解。`,
      breadth: `${role.name}涉猎广泛，对各种领域都有所了解，视野开阔。`,
      interest: `与${role.name}交谈从不会乏味，其谈吐风趣，观点新颖。`,
      wisdom: `${role.name}历经世事，有着自己独特的人生哲学与处世之道。`
    }
    return thoughts[node.id]
  }

  const getNodePosition = (node, idx) => {
    const baseAngle = node.angle * (Math.PI / 180)
    const driftSpeed = 0.12 + idx * 0.015
    const floatRadius = 12 + idx * 2
    const currentAngle = baseAngle + Math.sin(time * driftSpeed + node.floatPhase) * 0.25
    const floatX = Math.sin(time * 0.5 + node.floatPhase) * floatRadius
    const floatY = Math.cos(time * 0.4 + node.floatPhase * 1.2) * floatRadius * 0.6
    const breathe = 1 + Math.sin(time * 0.8 + node.floatPhase) * 0.06

    const x = Math.cos(currentAngle) * node.distance + floatX
    const y = Math.sin(currentAngle) * node.distance * 0.8 + floatY

    return { x, y, breathe }
  }

  const getAttributeValue = (attrId) => {
    if (!role.attributes) return 75
    const attrMap = {
      insight: role.attributes.insight || role.attributes.洞察力,
      empathy: role.attributes.empathy || role.attributes.共情力,
      logic: role.attributes.logic || role.attributes.批判力,
      breadth: role.attributes.breadth || role.attributes.信息广度,
      interest: role.attributes.interest || role.attributes.趣味性
    }
    return attrMap[attrId] || 70 + Math.floor(Math.random() * 20)
  }

  return (
    <div className="palace-mind-container active">
      <div className="palace-inner-frame">
        <div className="palace-corner corner-tl" />
        <div className="palace-corner corner-tr" />
        <div className="palace-corner corner-bl" />
        <div className="palace-corner corner-br" />

        <div className="central-thinker">
          <div className="thinker-halo" />
          <div className="thinker-glow" />
          <div className="thinker-frame">
            <CharacterAvatar role={role} className="thinker-portrait" />
          </div>
          <div className="thinker-pulse" />
          <div className="thinker-info">
            <h3 className="thinker-name">{role.name}</h3>
            <p className="thinker-title">{role.title || '— 思维殿堂 —'}</p>
          </div>
        </div>

        {THOUGHT_DIMENSIONS.map((node, idx) => {
          const pos = getNodePosition(node, idx)
          const isHovered = hoveredNode === node.id
          const attrValue = getAttributeValue(node.id)
          return (
            <div
              key={node.id}
              className={`thought-orb ${isHovered ? 'hovered' : ''}`}
              style={{
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y - 20}px)`,
                transform: `translate(-50%, -50%) scale(${pos.breathe})`,
                '--orb-accent': `var(--cyber-cyan)`
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className="orb-dot" />
              <div className="orb-ring" />
              <span className="orb-label">{node.label}</span>

              {isHovered && (
                <div className="orb-card">
                  <div className="card-header">
                    <span className="card-icon">{node.icon}</span>
                    <h4 className="card-title">{node.label}</h4>
                  </div>
                  <p className="card-subtitle">{node.desc}</p>
                  <div className="card-attribute">
                    <div className="attr-bar-bg">
                      <div className="attr-bar-fill" style={{ width: `${attrValue}%` }} />
                    </div>
                    <span className="attr-value">{attrValue}</span>
                  </div>
                  <p className="card-desc">{getThoughtContent(node)}</p>
                </div>
              )}
            </div>
          )
        })}

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
  const [activeTab, setActiveTab] = useState('map')
  const [showRoundtable, setShowRoundtable] = useState(false)
  const displayRoles = MOCK_ROLES.slice(0, 12)

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
          <p className="palace-slogan">MIND PALACE · 观其思，知其人</p>
          <div className="title-ornament">
            <span className="ornament-line" />
            <span className="ornament-diamond">◆</span>
            <span className="ornament-line" />
          </div>
        </div>
        <div className="palace-tabs">
          <button
            className={`palace-tab ${activeTab === 'map' ? 'current' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            🏛️ 思维图谱
          </button>
          <button
            className={`palace-tab ${activeTab === 'discuss' ? 'current' : ''}`}
            onClick={() => { setActiveTab('discuss'); setShowRoundtable(true) }}
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
                  onClick={() => { setSelectedIndex(index); setActiveTab('map') }}
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
              <span className="heading-deco">❋</span>
              <h2 className="heading-text">思 维 图 谱</h2>
              <span className="heading-deco">❋</span>
            </div>
            <p className="stage-hint">悬停思维节点，洞察人物维度 · 点击「茶话会」开启多角色讨论</p>
            <div className="map-canvas">
              {displayRoles.map((role, index) => (
                <PalaceMindMap
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
        <PrismRoundtable onClose={() => { setShowRoundtable(false); setActiveTab('map') }} />
      )}
    </div>
  )
}
