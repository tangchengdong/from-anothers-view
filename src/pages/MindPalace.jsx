import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_ROLES, getCardImagePath, getLocalImagePath, getMockNews, generateOpinion } from '../mock/data'
import { analyzeAttitude, ATTITUDE_CONFIG } from '../utils/opinionAnalyzer'
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
                '--orb-accent': `var(--paper-accent)`
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

function DiscussionPanel({ roles }) {
  const [selectedChatRoles, setSelectedChatRoles] = useState([])
  const [hotNews, setHotNews] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const news = getMockNews(8)
    setHotNews(news)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getCurrentTime = () => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }

  const toggleChatRole = (role) => {
    setSelectedChatRoles(prev => {
      const exists = prev.find(r => r.name === role.name)
      if (exists) {
        return prev.filter(r => r.name !== role.name)
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), role]
      }
      return [...prev, role]
    })
  }

  const startDiscussion = (topic = null) => {
    if (selectedChatRoles.length === 0) return
    setSelectedTopic(topic)
    setMessages([])

    const welcomeMsg = topic
      ? { id: 'sys-1', type: 'system', content: `📰 今日话题：${topic.title}`, time: getCurrentTime() }
      : { id: 'sys-1', type: 'system', content: '💬 自由畅谈模式', time: getCurrentTime() }

    setMessages([welcomeMsg])

    if (topic) {
      setMessages(prev => [...prev, {
        id: 'news-1',
        type: 'news',
        news: topic,
        time: getCurrentTime()
      }])
    }

    selectedChatRoles.forEach((role, idx) => {
      setTimeout(() => {
        setIsTyping(role.name)
        setTimeout(() => {
          let content
          if (topic) {
            content = generateOpinion(role, topic)
          } else {
            const greetings = [
              `${role.emoji || '✋'} 破茧者，今日想探讨些什么？`,
              `幸会！我是${role.name}，有何见教？`,
              `${role.emoji || '✨'} 很高兴与你交谈，请讲。`,
              `来啦？想听听老夫对何事的看法？`
            ]
            content = greetings[Math.floor(Math.random() * greetings.length)]
          }
          const analysis = analyzeAttitude(content)
          setMessages(prev => [...prev, {
            id: `role-${idx}-${Date.now()}`,
            type: 'role',
            role,
            content,
            attitude: analysis?.attitude,
            time: getCurrentTime()
          }])
          setIsTyping(null)
        }, 1000 + Math.random() * 800)
      }, 600 + idx * 1200)
    })
  }

  const handleSend = () => {
    if (!inputText.trim() || selectedChatRoles.length === 0) return

    const userMsg = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputText.trim(),
      time: getCurrentTime()
    }
    setMessages(prev => [...prev, userMsg])
    setInputText('')

    setTimeout(() => {
      const replyRole = selectedChatRoles[Math.floor(Math.random() * selectedChatRoles.length)]
      setIsTyping(replyRole.name)
      setTimeout(() => {
        let reply
        if (selectedTopic) {
          const opinions = [
            `此言有理，容我补充... ${generateOpinion(replyRole, selectedTopic).slice(0, 100)}`,
            `嗯，这个角度颇为有趣，我倒觉得...`,
            `诚然！以我之见...`,
            `容我思忖片刻...其实此事...`,
            `你说到关键了！我此前也在想...`
          ]
          reply = opinions[Math.floor(Math.random() * opinions.length)]
        } else {
          const replies = [
            `嗯嗯，此话题甚妙，且听我道来...`,
            `哈哈，你这么说我倒想起一桩事...`,
            `确实如此，我亦有同感！而且...`,
            `有意思，换个角度思忖...`,
            `这个问题问得好，我以为...`
          ]
          reply = replies[Math.floor(Math.random() * replies.length)]
        }
        setMessages(prev => [...prev, {
          id: `reply-${Date.now()}`,
          type: 'role',
          role: replyRole,
          content: reply,
          time: getCurrentTime(),
          isReply: true
        }])
        setIsTyping(null)
      }, 800 + Math.random() * 800)
    }, 400)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatViews = (views) => views >= 10000 ? (views / 10000).toFixed(1) + '万' : views

  return (
    <div className="discussion-parlor">
      <div className="parlor-header">
        <h3 className="parlor-title">— 茶 话 室 —</h3>
        <p className="parlor-hint">选择一至三位角色，共话热点或闲谈</p>
      </div>

      <div className="role-select">
        <p className="select-label">选择对话者：</p>
        <div className="select-roles">
          {roles.slice(0, 12).map(role => {
            const isSelected = selectedChatRoles.find(r => r.name === role.name)
            return (
              <button
                key={role.name}
                className={`select-role ${isSelected ? 'picked' : ''}`}
                onClick={() => toggleChatRole(role)}
              >
                <CharacterAvatar role={role} className="select-avatar" />
                <span className="select-name">{role.name}</span>
                {isSelected && <span className="select-mark">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {selectedChatRoles.length > 0 && messages.length === 0 && (
        <div className="topic-parlor">
          <div className="topic-section">
            <p className="topic-heading">📰 热点话题</p>
            <div className="topic-list">
              {hotNews.slice(0, 5).map(news => (
                <button
                  key={news.id}
                  className="topic-entry"
                  onClick={() => startDiscussion(news)}
                >
                  <span className="topic-tag">{news.category}</span>
                  <span className="topic-text">{news.title}</span>
                </button>
              ))}
            </div>
          </div>
          <button className="free-talk-btn" onClick={() => startDiscussion(null)}>
            ✨ 自 由 闲 谈
          </button>
        </div>
      )}

      {messages.length > 0 && (
        <div className="chat-parlor">
          <div className="chat-scroll">
            {messages.map(msg => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="chat-sys">
                    <span className="sys-stamp">{msg.time}</span>
                    <div className="sys-banner">{msg.content}</div>
                  </div>
                )
              }
              if (msg.type === 'news') {
                return (
                  <div key={msg.id} className="chat-news-clip">
                    <div className="clip-top">
                      <span className="clip-tag">📰 号外</span>
                      <span className="clip-stamp">{msg.time}</span>
                    </div>
                    <h4 className="clip-title">{msg.news.title}</h4>
                    <p className="clip-summary">{msg.news.summary}</p>
                    <div className="clip-meta">
                      <span>{msg.news.source}</span>
                      <span>·</span>
                      <span>阅览 {formatViews(msg.news.views)}</span>
                    </div>
                  </div>
                )
              }
              if (msg.type === 'user') {
                return (
                  <div key={msg.id} className="chat-msg user">
                    <div className="msg-body user-body">
                      <div className="bubble user-bubble">{msg.content}</div>
                      <span className="stamp">{msg.time}</span>
                    </div>
                    <div className="msg-portrait user-portrait">
                      <span>👤</span>
                    </div>
                  </div>
                )
              }
              if (msg.type === 'role') {
                const cfg = msg.attitude ? ATTITUDE_CONFIG[msg.attitude] : null
                return (
                  <div key={msg.id} className={`chat-msg speaker ${msg.isReply ? 'reply' : ''}`}>
                    <div className="msg-portrait">
                      <CharacterAvatar role={msg.role} className="chat-avatar-sm" />
                    </div>
                    <div className="msg-body">
                      <div className="msg-speaker">
                        <span className="speaker-name">{msg.role.name}</span>
                        {cfg && <span className="speaker-badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon}</span>}
                      </div>
                      <div className="bubble speaker-bubble">
                        {msg.content}
                      </div>
                      <span className="stamp">{msg.time}</span>
                    </div>
                  </div>
                )
              }
              return null
            })}
            {isTyping && (
              <div className="chat-msg speaker typing">
                <div className="msg-portrait">
                  <span className="typing-icon">💭</span>
                </div>
                <div className="msg-body">
                  <div className="msg-speaker">
                    <span className="speaker-name">{isTyping}</span>
                    <span className="typing-tag">思忖中...</span>
                  </div>
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-row">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="畅所欲言..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="chat-submit"
              onClick={handleSend}
              disabled={!inputText.trim()}
            >
              发 送
            </button>
          </div>
          <p className="chat-tip">Enter 发送 · 以礼相待</p>

          <button className="exit-chat" onClick={() => { setMessages([]); setSelectedTopic(null) }}>
            ← 返回选择话题
          </button>
        </div>
      )}
    </div>
  )
}

export default function MindPalace() {
  const navigate = useNavigate()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('map')
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
            onClick={() => setActiveTab('discuss')}
          >
            💬 茶话室
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
          {activeTab === 'map' ? (
            <div className="stage-map">
              <div className="stage-heading">
                <span className="heading-deco">❋</span>
                <h2 className="heading-text">思 维 图 谱</h2>
                <span className="heading-deco">❋</span>
              </div>
              <p className="stage-hint">悬停思维节点，洞察人物维度</p>
              <div className="map-canvas">
                {displayRoles.map((role, index) => (
                  <PalaceMindMap
                    key={role.name}
                    role={role}
                    isActive={selectedIndex === index}
                  />
                ))}
              </div>
            </div>
          ) : (
            <DiscussionPanel roles={displayRoles} />
          )}
        </div>
      </div>
    </div>
  )
}
