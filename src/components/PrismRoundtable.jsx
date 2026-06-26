import React, { useState, useEffect } from 'react'
import { getHotNewsRanking, getMultiPerspectiveNews, MOCK_ROLES, getLocalImagePath, getCardImagePath } from '../mock/data'
import { analyzeAttitude, ATTITUDE_CONFIG } from '../utils/opinionAnalyzer'
import TeaPartyChat from './TeaPartyChat'
import './PrismRoundtable.css'

function PrismRoundtable({ onClose }) {
  const [hotNews, setHotNews] = useState([])
  const [selectedNews, setSelectedNews] = useState(null)
  const [perspectives, setPerspectives] = useState([])
  const [imageLoadError, setImageLoadError] = useState({})
  const [activeTab, setActiveTab] = useState('list')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const news = getHotNewsRanking(6)
    setHotNews(news)
    const defaultPerspectives = MOCK_ROLES.slice(0, 5)
    setPerspectives(defaultPerspectives)
    setLoading(false)
  }, [])

  const handleNewsSelect = (news) => {
    const multiNews = getMultiPerspectiveNews(perspectives, 1)
    const targetNews = multiNews.find(n => n.id === news.id) || {
      ...news,
      opinions: {}
    }
    perspectives.forEach(p => {
      if (!targetNews.opinions[p.name]) {
        targetNews.opinions[p.name] = generateQuickOpinion(p, news)
      }
    })
    setSelectedNews(targetNews)
    setActiveTab('perspectives')
  }

  const generateQuickOpinion = (perspective, news) => {
    const attitudes = ['这是一个值得关注的现象', '对此我有不同看法', '从专业角度来看', '这背后反映了深层问题', '作为普通市民的我想说']
    return `${attitudes[Math.floor(Math.random() * attitudes.length)]}，${news.title}——${perspective.name}认为这与我们每个人都息息相关，需要理性看待和深入思考。`
  }

  const handleBack = () => {
    if (activeTab === 'chat') {
      setActiveTab('perspectives')
    } else if (activeTab === 'perspectives') {
      setActiveTab('list')
      setSelectedNews(null)
    }
  }

  const getAvatarUrl = (p) => {
    const cardKey = `card_${p.local_image}`
    const localKey = `local_${p.local_image}`
    if (p.card_image && !imageLoadError[cardKey]) {
      return { url: getCardImagePath(p.card_image), isCard: true, key: cardKey }
    }
    if (p.local_image && !imageLoadError[localKey]) {
      return { url: getLocalImagePath(p.local_image), isCard: false, key: localKey }
    }
    return null
  }

  const handleAvatarError = (key) => {
    setImageLoadError(prev => ({ ...prev, [key]: true }))
  }

  const renderAvatar = (p, size = 'normal') => {
    const avatar = getAvatarUrl(p)
    const className = size === 'small' ? 'roundtable-avatar-small' : 'roundtable-avatar'
    if (avatar) {
      return (
        <img
          src={avatar.url}
          alt={p.name}
          className={className}
          onError={() => handleAvatarError(avatar.key)}
        />
      )
    }
    return <span className="roundtable-emoji">{p.emoji}</span>
  }

  const formatViews = (views) => {
    if (views >= 10000) return (views / 10000).toFixed(1) + '万'
    return views
  }

  return (
    <div className="roundtable-overlay" onClick={onClose}>
      <div className="roundtable-modal" onClick={e => e.stopPropagation()}>
        <div className="roundtable-header">
          <div className="roundtable-header-left">
            {activeTab !== 'list' && (
              <button className="roundtable-back-btn" onClick={handleBack}>
                ← 返回
              </button>
            )}
            <div className="roundtable-title-wrap">
              <span className="roundtable-icon">❖</span>
              <h2 className="roundtable-title">棱镜圆桌会</h2>
            </div>
          </div>
          <button className="roundtable-close" onClick={onClose}>✕</button>
        </div>

        <div className="roundtable-content">
          {loading ? (
            <div className="roundtable-loading">
              <div className="roundtable-spinner"></div>
              <p>正在准备圆桌讨论...</p>
            </div>
          ) : activeTab === 'list' ? (
            <div className="roundtable-news-list">
              <p className="roundtable-subtitle">选择一则热点新闻，开启多重视角讨论</p>
              <div className="roundtable-news-grid">
                {hotNews.map((news, index) => (
                  <div
                    key={news.id}
                    className="roundtable-news-card"
                    onClick={() => handleNewsSelect(news)}
                  >
                    <div className="news-card-rank">
                      <span className={`rank-num rank-${Math.min(index + 1, 3)}`}>{index + 1}</span>
                      {news.hot && <span className="rank-hot">热</span>}
                    </div>
                    <div className="news-card-content">
                      <h4 className="news-card-title">{news.title}</h4>
                      <div className="news-card-meta">
                        <span>{news.source}</span>
                        <span>·</span>
                        <span>👁 {formatViews(news.views)}</span>
                      </div>
                    </div>
                    <span className="news-card-arrow">→</span>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'perspectives' && selectedNews ? (
            <div className="roundtable-perspectives">
              <div className="roundtable-news-header">
                <span className="news-badge">📰 讨论话题</span>
                <h3 className="news-title">{selectedNews.title}</h3>
                <p className="news-summary">{selectedNews.summary}</p>
              </div>

              <div className="roundtable-tabs">
                <button
                  className={`rt-tab-btn ${activeTab === 'perspectives' ? 'active' : ''}`}
                >
                  ◈ 多重视角
                </button>
                <button
                  className="rt-tab-btn"
                  onClick={() => setActiveTab('chat')}
                >
                  🍵 进入茶话会
                </button>
              </div>

              <div className="roundtable-opinions">
                {perspectives.map((p, idx) => {
                  const opinion = selectedNews.opinions?.[p.name] || '...'
                  const analysis = analyzeAttitude(opinion)
                  const cfg = ATTITUDE_CONFIG[analysis.attitude]
                  return (
                    <div key={idx} className="rt-opinion-card" style={{ borderLeftColor: p.color }}>
                      <div className="rt-opinion-header">
                        {renderAvatar(p)}
                        <span className="rt-opinion-name" style={{ color: p.color }}>{p.name}</span>
                        <span className="rt-opinion-attitude" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <p className="rt-opinion-text font-serif">"{opinion}"</p>
                    </div>
                  )
                })}
              </div>

              <div className="roundtable-cta">
                <button className="rt-enter-chat-btn" onClick={() => setActiveTab('chat')}>
                  🍵 进入茶话会，一起讨论 →
                </button>
              </div>
            </div>
          ) : activeTab === 'chat' && selectedNews ? (
            <div className="roundtable-chat">
              <TeaPartyChat news={selectedNews} perspectives={perspectives} onClose={null} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default PrismRoundtable
