import React, { useState, useEffect } from 'react'
import { getLocalImagePath, getCardImagePath } from '../mock/data'
import { getHotNews, getBatchCommentary, suggestPerspectives } from '../api/content'
import { analyzeAttitude, ATTITUDE_CONFIG } from '../utils/opinionAnalyzer'
import TeaPartyChat from './TeaPartyChat'
import './HotNewsRanking.css'

const PERSPECTIVE_COLORS = ['#FF6B9D', '#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#6366F1']

const FALLBACK_PERSPECTIVES = [
  { name: 'AI研究员', emoji: '🤖', color: '#8B5CF6' },
  { name: '科技控', emoji: '💻', color: '#3B82F6' },
  { name: '创作者', emoji: '🎨', color: '#EC4899' },
  { name: '投资人', emoji: '💰', color: '#F59E0B' },
  { name: '哲学家', emoji: '🤔', color: '#6366F1' }
]

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
    const loadData = async () => {
      try {
        const data = await getHotNews(8)
        setHotNews(data.items || [])
      } catch (err) {
        console.error('Failed to fetch hot news:', err)
        setHotNews([])
      }

      try {
        const data = await suggestPerspectives(5)
        const list = data.data || data.items || data || []
        const withColors = (Array.isArray(list) ? list : []).map((p, idx) => ({
          ...p,
          color: p.color || PERSPECTIVE_COLORS[idx % PERSPECTIVE_COLORS.length]
        }))
        setPerspectives(withColors.length > 0 ? withColors : FALLBACK_PERSPECTIVES)
      } catch (err) {
        console.error('Failed to fetch perspectives:', err)
        setPerspectives(FALLBACK_PERSPECTIVES)
      }

      setLoading(false)
    }
    loadData()
  }, [])

  const handleNewsClick = async (news) => {
    setSelectedNews(news.id)
    setActiveTab('perspectives')
    setDetailNews({ ...news, opinions: {} })
    setShowDetail(true)
    onNewsSelect?.(news)

    try {
      const perspectiveNames = perspectives.map(p => p.name)
      const data = await getBatchCommentary(news.id, perspectiveNames)
      setDetailNews(prev => prev ? {
        ...prev,
        opinions: data.opinions || {}
      } : prev)
    } catch (err) {
      console.error('Failed to fetch commentary:', err)
    }
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
