import React, { useState, useEffect } from 'react'
import { getHotNewsRanking, getMultiPerspectiveNews, MOCK_ROLES, getLocalImagePath, getCardImagePath } from '../mock/data'
import { analyzeAttitude, ATTITUDE_CONFIG } from '../utils/opinionAnalyzer'
import TeaPartyChat from './TeaPartyChat'
import './HotNewsRanking.css'

function HotNewsRanking({ onNewsSelect }) {
  const [hotNews, setHotNews] = useState([])
  const [selectedNews, setSelectedNews] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailNews, setDetailNews] = useState(null)
  const [perspectives, setPerspectives] = useState([])
  const [imageLoadError, setImageLoadError] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('perspectives')

  useEffect(() => {
    const news = getHotNewsRanking(8)
    setHotNews(news)
    const defaultPerspectives = MOCK_ROLES.slice(0, 5)
    setPerspectives(defaultPerspectives)
    setLoading(false)
  }, [])

  const handleNewsClick = (news) => {
    setSelectedNews(news.id)
    setActiveTab('perspectives')
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
    setDetailNews(targetNews)
    setShowDetail(true)
    onNewsSelect?.(news)
  }

  const generateQuickOpinion = (perspective, news) => {
    const attitudes = ['这是一个值得关注的现象', '对此我有不同看法', '从专业角度来看', '这背后反映了深层问题', '作为普通市民的我想说']
    return `${attitudes[Math.floor(Math.random() * attitudes.length)]}，${news.title}——${perspective.name}认为这与我们每个人都息息相关，需要理性看待和深入思考。`
  }

  const handleCloseDetail = () => {
    setShowDetail(false)
    setDetailNews(null)
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

  const renderAvatar = (p, size = 'small') => {
    const avatar = getAvatarUrl(p)
    const className = size === 'small' ? 'ranking-avatar-small' : 'ranking-avatar-large'
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
    return <span className="ranking-emoji">{p.emoji}</span>
  }

  const formatViews = (views) => {
    if (views >= 10000) return (views / 10000).toFixed(1) + '万'
    return views
  }

  if (loading) {
    return (
      <div className="hot-news-ranking loading">
        <div className="ranking-spinner"></div>
      </div>
    )
  }

  return (
    <>
      <div className="hot-news-ranking">
        <div className="ranking-header">
          <span className="ranking-icon">🔥</span>
          <h3 className="ranking-title">热点榜单</h3>
          <span className="ranking-subtitle">多重视角解读</span>
        </div>
        <div className="ranking-list">
          {hotNews.map((news, index) => (
            <div
              key={news.id}
              className={`ranking-item ${selectedNews === news.id ? 'active' : ''}`}
              onClick={() => handleNewsClick(news)}
            >
              <span className={`ranking-number rank-${Math.min(index + 1, 3)}`}>
                {index + 1}
              </span>
              <div className="ranking-content">
                <h4 className="ranking-news-title">{news.title}</h4>
                <div className="ranking-meta">
                  <span className="ranking-source">{news.source}</span>
                  <span className="ranking-views">👁 {formatViews(news.views)}</span>
                </div>
              </div>
              {news.hot && <span className="ranking-hot-badge">热</span>}
            </div>
          ))}
        </div>
      </div>

      {showDetail && detailNews && (
        <div className="hot-detail-overlay" onClick={handleCloseDetail}>
          <div className="hot-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="hot-detail-close" onClick={handleCloseDetail}>✕</button>
            
            <div className="hot-detail-header">
              <span className="hot-detail-badge">🔥 热点解读</span>
              <h2 className="hot-detail-title">{detailNews.title}</h2>
              <div className="hot-detail-meta">
                <span>{detailNews.source}</span>
                <span>·</span>
                <span>阅读 {formatViews(detailNews.views)}</span>
              </div>
              <p className="hot-detail-summary">{detailNews.summary}</p>
            </div>

            <div className="hot-detail-tabs">
              <button
                className={`hot-tab-btn ${activeTab === 'perspectives' ? 'active' : ''}`}
                onClick={() => setActiveTab('perspectives')}
              >
                ◈ 多重视角
              </button>
              <button
                className={`hot-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                🍵 茶话会
              </button>
            </div>

            {activeTab === 'perspectives' && (
              <div className="hot-detail-perspectives">
                <div className="hot-detail-opinions">
                  {perspectives.map((p, idx) => {
                    const opinion = detailNews.opinions?.[p.name] || '...'
                    const analysis = analyzeAttitude(opinion)
                    const cfg = ATTITUDE_CONFIG[analysis.attitude]
                    return (
                      <div key={idx} className="hot-opinion-card" style={{ borderLeftColor: p.color }}>
                        <div className="hot-opinion-header">
                          {renderAvatar(p, 'large')}
                          <span className="hot-opinion-name" style={{ color: p.color }}>{p.name}</span>
                          <span className="hot-opinion-attitude" style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </div>
                        <p className="hot-opinion-text font-serif">"{opinion}"</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="hot-detail-chat">
                <TeaPartyChat news={detailNews} perspectives={perspectives} />
              </div>
            )}

            {activeTab === 'perspectives' && (
              <div className="hot-detail-footer">
                <p className="hot-detail-quote">"棱镜折射七彩光，世界不止一个模样"</p>
                <button className="hot-chat-entry-btn" onClick={() => setActiveTab('chat')}>
                  🍵 进入茶话会讨论 →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default HotNewsRanking
