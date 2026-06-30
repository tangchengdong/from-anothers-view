import React, { useState, useEffect } from 'react'
import { getHotNewsRanking, getSuggestedPerspectives, getCardImagePath } from '../mock/data'
import './DebateRoom.css'

const DEBATE_ROLES = [
  { position: 1, label: '一辩', role: '开篇立论' },
  { position: 2, label: '二辩', role: '攻辩交锋' },
  { position: 3, label: '三辩', role: '总结陈词' },
]

function DebateRoom({ onClose }) {
  const [phase, setPhase] = useState('news-select')
  const [hotNews, setHotNews] = useState([])
  const [selectedNews, setSelectedNews] = useState(null)
  const [proTeam, setProTeam] = useState([null, null, null])
  const [conTeam, setConTeam] = useState([null, null, null])
  const [availableRoles, setAvailableRoles] = useState([])
  const [currentSide, setCurrentSide] = useState('pro')
  const [currentSlot, setCurrentSlot] = useState(0)
  const [imageLoadError, setImageLoadError] = useState({})
  const [debateStarted, setDebateStarted] = useState(false)
  const [currentSpeaker, setCurrentSpeaker] = useState(null)
  const [debateMessages, setDebateMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const news = getHotNewsRanking(8)
    setHotNews(news)
    const roles = getSuggestedPerspectives(12)
    setAvailableRoles(roles)
    setLoading(false)
  }, [])

  const handleNewsSelect = (news) => {
    setSelectedNews(news)
    setPhase('role-select')
  }

  const handleRoleSelect = (role) => {
    if (currentSide === 'pro') {
      const newTeam = [...proTeam]
      newTeam[currentSlot] = role
      setProTeam(newTeam)
      if (currentSlot < 2) {
        setCurrentSlot(currentSlot + 1)
      } else {
        setCurrentSide('con')
        setCurrentSlot(0)
      }
    } else {
      const newTeam = [...conTeam]
      newTeam[currentSlot] = role
      setConTeam(newTeam)
      if (currentSlot < 2) {
        setCurrentSlot(currentSlot + 1)
      }
    }
  }

  const handleSlotClick = (side, slot) => {
    setCurrentSide(side)
    setCurrentSlot(slot)
  }

  const canStartDebate = () => {
    return proTeam.every(p => p !== null) && conTeam.every(p => p !== null)
  }

  const getAvatarUrl = (p) => {
    const cardKey = `debate_${p.local_image}`
    if (p.card_image && !imageLoadError[cardKey]) {
      return { url: getCardImagePath(p.card_image), key: cardKey }
    }
    return null
  }

  const handleAvatarError = (key) => {
    setImageLoadError(prev => ({ ...prev, [key]: true }))
  }

  const generateDebateSpeech = (role, side, position, news) => {
    const proTemplates = {
      1: [
        `尊敬的评委、对方辩友，大家好。我方认为，${news.title}是时代发展的必然趋势。作为${role.name}，我深知这其中蕴含的深远意义...`,
        `开宗明义，我方坚定认为${news.title}利大于弊。历史的长河告诉我们，进步的脚步不可阻挡...`,
      ],
      2: [
        `对方辩友的观点看似有理，实则经不起推敲。让我们从事实出发，看看${news.title}究竟带来了什么...`,
        `刚才对方辩友的论述存在几个明显的漏洞。首先，${news.title}并非如对方所说的那样...`,
      ],
      3: [
        `综上所述，我方从多个角度论证了${news.title}的合理性与必然性。这是时代的选择，更是人民的选择...`,
        `最后，我想再次强调，${news.title}不仅是一个趋势，更是一种责任。让我们拥抱变化，共创未来...`,
      ],
    }

    const conTemplates = {
      1: [
        `尊敬的评委、对方辩友，大家好。我方认为，${news.title}需要审慎对待，不能盲目乐观。作为${role.name}，我看到了其中隐藏的问题...`,
        `开宗明义，我方认为${news.title}弊大于利。历史的教训告诉我们，凡事过犹不及...`,
      ],
      2: [
        `对方辩友的论证看似充分，实则回避了核心问题。让我们冷静思考，${news.title}真的如对方所说的那么美好吗...`,
        `刚才对方辩友的论述有失偏颇。我方认为，在讨论${news.title}时，不能只看到光鲜的一面...`,
      ],
      3: [
        `综上所述，我方从多个层面揭示了${news.title}可能带来的风险与问题。这不是危言耸听，而是理性的警示...`,
        `最后，我想说的是，${news.title}需要的不是盲目追捧，而是理性审视。让我们放慢脚步，三思而后行...`,
      ],
    }

    const templates = side === 'pro' ? proTemplates : conTemplates
    const positionTemplates = templates[position]
    return positionTemplates[Math.floor(Math.random() * positionTemplates.length)]
  }

  const startDebate = () => {
    setPhase('debate')
    setDebateStarted(true)

    const messages = []
    const order = [
      { side: 'pro', position: 0 },
      { side: 'con', position: 0 },
      { side: 'pro', position: 1 },
      { side: 'con', position: 1 },
      { side: 'pro', position: 2 },
      { side: 'con', position: 2 },
    ]

    order.forEach((item, index) => {
      const team = item.side === 'pro' ? proTeam : conTeam
      const role = team[item.position]
      const speech = generateDebateSpeech(role, item.side, item.position + 1, selectedNews)
      messages.push({
        id: index,
        side: item.side,
        position: item.position,
        role: role,
        speech: speech,
        delay: index * 2000,
      })
    })

    setDebateMessages(messages)

    let currentIndex = 0
    const showNext = () => {
      if (currentIndex < messages.length) {
        setCurrentSpeaker(currentIndex)
        currentIndex++
        setTimeout(showNext, 2500)
      }
    }

    setTimeout(showNext, 1000)
  }

  const formatViews = (views) => {
    if (views >= 10000) return (views / 10000).toFixed(1) + '万'
    return views
  }

  const renderNewsSelect = () => (
    <div className="debate-news-select">
      <div className="debate-phase-header">
        <div className="phase-label">
          <span className="label-num">壹</span>
          <span className="label-text">选题</span>
        </div>
        <h2 className="phase-title">选择辩论话题</h2>
        <p className="phase-desc font-serif">挑选一则热点新闻，开启正反方精彩辩论</p>
      </div>

      <div className="news-list">
        {hotNews.map((news, index) => (
          <div
            key={news.id}
            className="news-debate-card"
            onClick={() => handleNewsSelect(news)}
          >
            <div className="news-rank">
              <span className={`rank-badge rank-${Math.min(index + 1, 3)}`}>
                {index + 1}
              </span>
            </div>
            <div className="news-body">
              <h3 className="news-title font-serif">{news.title}</h3>
              <div className="news-meta">
                <span className="news-source">{news.source}</span>
                <span className="meta-divider">·</span>
                <span className="news-views">{formatViews(news.views)} 热度</span>
              </div>
            </div>
            <div className="news-action">
              <span className="action-text">选题</span>
              <span className="action-arrow">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderRoleSelect = () => (
    <div className="debate-role-select">
      <div className="debate-phase-header">
        <div className="phase-label">
          <span className="label-num">贰</span>
          <span className="label-text">点将</span>
        </div>
        <h2 className="phase-title">选择辩论阵容</h2>
        {selectedNews && (
          <div className="selected-topic-banner">
            <span className="topic-banner-tag">辩题</span>
            <span className="topic-banner-text font-serif">{selectedNews.title}</span>
          </div>
        )}
        <p className="phase-desc font-serif">
          当前：
          <span className={`current-side ${currentSide}`}>
            {currentSide === 'pro' ? '正方' : '反方'} · {DEBATE_ROLES[currentSlot].label}
          </span>
        </p>
      </div>

      <div className="debate-arena">
        <div className="team-column pro-column">
          <div className="team-header pro">
            <span className="team-mark">正</span>
            <span className="team-name">正方</span>
          </div>
          <div className="team-roster">
            {DEBATE_ROLES.map((pos, idx) => (
              <div
                key={idx}
                className={`roster-slot ${proTeam[idx] ? 'filled' : ''} ${currentSide === 'pro' && currentSlot === idx ? 'active' : ''}`}
                onClick={() => handleSlotClick('pro', idx)}
              >
                <div className="slot-position">
                  <span className="pos-label">{pos.label}</span>
                  <span className="pos-role">{pos.role}</span>
                </div>
                {proTeam[idx] ? (
                  <div className="slot-avatar">
                    {getAvatarUrl(proTeam[idx]) ? (
                      <img
                        src={getAvatarUrl(proTeam[idx]).url}
                        alt={proTeam[idx].name}
                        className="avatar-img"
                        onError={() => handleAvatarError(getAvatarUrl(proTeam[idx]).key)}
                      />
                    ) : (
                      <span className="avatar-emoji">{proTeam[idx].emoji}</span>
                    )}
                    <span className="avatar-name">{proTeam[idx].name}</span>
                  </div>
                ) : (
                  <div className="slot-empty">
                    <span className="empty-plus">+</span>
                    <span className="empty-text">待选</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="arena-center">
          <div className="vs-container">
            <div className="vs-line top" />
            <div className="vs-text">辩</div>
            <div className="vs-line bottom" />
          </div>
          <div className="topic-display">
            <span className="topic-label">辩题</span>
            <p className="topic-text font-serif">{selectedNews?.title}</p>
          </div>
        </div>

        <div className="team-column con-column">
          <div className="team-header con">
            <span className="team-mark">反</span>
            <span className="team-name">反方</span>
          </div>
          <div className="team-roster">
            {DEBATE_ROLES.map((pos, idx) => (
              <div
                key={idx}
                className={`roster-slot ${conTeam[idx] ? 'filled' : ''} ${currentSide === 'con' && currentSlot === idx ? 'active' : ''}`}
                onClick={() => handleSlotClick('con', idx)}
              >
                <div className="slot-position">
                  <span className="pos-label">{pos.label}</span>
                  <span className="pos-role">{pos.role}</span>
                </div>
                {conTeam[idx] ? (
                  <div className="slot-avatar">
                    {getAvatarUrl(conTeam[idx]) ? (
                      <img
                        src={getAvatarUrl(conTeam[idx]).url}
                        alt={conTeam[idx].name}
                        className="avatar-img"
                        onError={() => handleAvatarError(getAvatarUrl(conTeam[idx]).key)}
                      />
                    ) : (
                      <span className="avatar-emoji">{conTeam[idx].emoji}</span>
                    )}
                    <span className="avatar-name">{conTeam[idx].name}</span>
                  </div>
                ) : (
                  <div className="slot-empty">
                    <span className="empty-plus">+</span>
                    <span className="empty-text">待选</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="role-pool">
        <div className="pool-header">
          <span className="pool-title">角色池</span>
          <span className="pool-hint font-serif">点击角色添加到当前位置</span>
        </div>
        <div className="pool-grid">
          {availableRoles.map((role, idx) => {
            const isSelected = proTeam.some(p => p?.local_image === role.local_image) ||
                              conTeam.some(p => p?.local_image === role.local_image)
            return (
              <div
                key={idx}
                className={`pool-card ${isSelected ? 'selected' : ''}`}
                onClick={() => !isSelected && handleRoleSelect(role)}
              >
                <div className="card-portrait">
                  {getAvatarUrl(role) ? (
                    <img
                      src={getAvatarUrl(role).url}
                      alt={role.name}
                      className="portrait-img"
                      onError={() => handleAvatarError(getAvatarUrl(role).key)}
                    />
                  ) : (
                    <span className="portrait-emoji">{role.emoji}</span>
                  )}
                </div>
                <div className="card-info">
                  <span className="card-name" style={{ color: role.color }}>{role.name}</span>
                  <span className="card-desc">{role.description}</span>
                </div>
                {isSelected && <div className="card-check">已选</div>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="debate-actions">
        <button className="action-btn secondary" onClick={() => setPhase('news-select')}>
          ← 返回选题
        </button>
        <button
          className={`action-btn primary ${canStartDebate() ? 'ready' : ''}`}
          onClick={startDebate}
          disabled={!canStartDebate()}
        >
          {canStartDebate() ? '开 始 辩 论' : `请选择${currentSide === 'pro' ? '正方' : '反方'}${DEBATE_ROLES[currentSlot].label}`}
        </button>
      </div>
    </div>
  )

  const renderDebate = () => (
    <div className="debate-live">
      <div className="live-header">
        <div className="live-topic">
          <span className="topic-tag">辩题</span>
          <h2 className="topic-main font-serif">{selectedNews?.title}</h2>
        </div>
      </div>

      <div className="live-stage">
        <div className="stage-side pro-side">
          <div className="side-label pro">
            <span className="label-mark">正</span>
            <span className="label-name">正方</span>
          </div>
          <div className="side-debaters">
            {proTeam.map((role, idx) => (
              <div
                key={idx}
                className={`debater-item ${currentSpeaker !== null && debateMessages[currentSpeaker]?.side === 'pro' && debateMessages[currentSpeaker]?.position === idx ? 'speaking' : ''}`}
              >
                <div className="debater-portrait">
                  {getAvatarUrl(role) ? (
                    <img
                      src={getAvatarUrl(role).url}
                      alt={role.name}
                      className="debater-img"
                      onError={() => handleAvatarError(getAvatarUrl(role).key)}
                    />
                  ) : (
                    <span className="debater-emoji">{role.emoji}</span>
                  )}
                  <div className="speaking-indicator" />
                </div>
                <div className="debater-meta">
                  <span className="debater-pos">{DEBATE_ROLES[idx].label}</span>
                  <span className="debater-name">{role.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stage-middle">
          <div className="middle-vs">
            <span className="vs-char">辩</span>
          </div>
        </div>

        <div className="stage-side con-side">
          <div className="side-label con">
            <span className="label-mark">反</span>
            <span className="label-name">反方</span>
          </div>
          <div className="side-debaters">
            {conTeam.map((role, idx) => (
              <div
                key={idx}
                className={`debater-item ${currentSpeaker !== null && debateMessages[currentSpeaker]?.side === 'con' && debateMessages[currentSpeaker]?.position === idx ? 'speaking' : ''}`}
              >
                <div className="debater-portrait">
                  {getAvatarUrl(role) ? (
                    <img
                      src={getAvatarUrl(role).url}
                      alt={role.name}
                      className="debater-img"
                      onError={() => handleAvatarError(getAvatarUrl(role).key)}
                    />
                  ) : (
                    <span className="debater-emoji">{role.emoji}</span>
                  )}
                  <div className="speaking-indicator" />
                </div>
                <div className="debater-meta">
                  <span className="debater-pos">{DEBATE_ROLES[idx].label}</span>
                  <span className="debater-name">{role.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="live-transcript">
        <div className="transcript-header">
          <span className="transcript-title">辩 论 实 录</span>
          <span className="transcript-line" />
        </div>
        <div className="transcript-content">
          {debateMessages.slice(0, currentSpeaker + 1).map((msg, idx) => (
            <div
              key={msg.id}
              className={`transcript-entry ${msg.side}`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="entry-marker">
                <span className={`marker-side ${msg.side}`}>
                  {msg.side === 'pro' ? '正' : '反'}
                </span>
              </div>
              <div className="entry-body">
                <div className="entry-header">
                  <span className="entry-position">{DEBATE_ROLES[msg.position].label}</span>
                  <span className="entry-name">{msg.role.name}</span>
                </div>
                <p className="entry-text font-serif">{msg.speech}</p>
              </div>
            </div>
          ))}
          {currentSpeaker < debateMessages.length - 1 && (
            <div className="transcript-loading">
              <span className="loading-dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
              <span className="loading-text font-serif">下一位辩手正在准备...</span>
            </div>
          )}
        </div>
      </div>

      <div className="live-footer">
        <button className="footer-btn secondary" onClick={() => setPhase('role-select')}>
          ← 重新点将
        </button>
        {currentSpeaker >= debateMessages.length - 1 && (
          <button className="footer-btn primary" onClick={startDebate}>
            🔄 重新辩论
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="debate-room-overlay" onClick={onClose}>
      <div className="debate-room-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <span className="title-ornament left">❖</span>
            <h1 className="title-text">棱 镜 辩 论 室</h1>
            <span className="title-ornament right">❖</span>
          </div>
          <button className="header-close" onClick={onClose}>
            <span className="close-text">关闭</span>
            <span className="close-icon">✕</span>
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="debate-loading">
              <div className="loading-spinner" />
              <p className="font-serif">正在准备辩论室...</p>
            </div>
          ) : phase === 'news-select' ? (
            renderNewsSelect()
          ) : phase === 'role-select' ? (
            renderRoleSelect()
          ) : phase === 'debate' ? (
            renderDebate()
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default DebateRoom
