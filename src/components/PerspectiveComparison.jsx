import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMultiPerspectiveNews, getLocalImagePath } from '../mock/data'
import { analyzeAttitude, extractKeywords, calculateCollision, findConsensusAndDivergence, ATTITUDE_CONFIG } from '../utils/opinionAnalyzer'
import './PerspectiveComparison.css'

function PerspectiveComparison({ perspectives, onHighlightedPerspectiveChange }) {
  const navigate = useNavigate()
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeNewsIndex, setActiveNewsIndex] = useState(0)
  const [highlightedPerspective, setHighlightedPerspective] = useState(null)
  const [avatarErrors, setAvatarErrors] = useState({})

  const handleHighlightedChange = (perspective) => {
    const newPerspective = highlightedPerspective?.name === perspective?.name ? null : perspective
    setHighlightedPerspective(newPerspective)
    onHighlightedPerspectiveChange?.(newPerspective)
  }

  useEffect(() => {
    setLoading(true)
    setAvatarErrors({})
    setTimeout(() => {
      const multiNews = getMultiPerspectiveNews(perspectives, 6)
      setNews(multiNews)
      setLoading(false)
      setHighlightedPerspective(null)
    }, 600)
  }, [perspectives])

  const handleReadMore = (newsItem) => {
    const activePersp = highlightedPerspective || perspectives[0]
    navigate(`/content/${newsItem.id}`, {
      state: {
        content: { ...newsItem, perspective_name: activePersp?.name },
        perspective: activePersp
      }
    })
  }

  const handleAvatarError = (key) => {
    setAvatarErrors(prev => ({ ...prev, [key]: true }))
  }

  const currentNews = news[activeNewsIndex]

  const analysisData = useMemo(() => {
    if (!currentNews || !currentNews.opinions) return null

    const analyses = perspectives.map(p => {
      const opinion = currentNews.opinions[p.name] || ''
      const attitude = analyzeAttitude(opinion)
      const keywords = extractKeywords(opinion, 4)
      return { perspective: p, opinion, attitude, keywords }
    })

    const collisionScore = calculateCollision(analyses.map(a => a.opinion))
    const { consensus, divergence } = findConsensusAndDivergence(analyses)

    return { analyses, collisionScore, consensus, divergence }
  }, [currentNews, perspectives])

  if (loading) {
    return (
      <div className="comparison-loading">
        <div className="comparison-spinner"></div>
        <p>◈ 正在整理五重观点棱镜...</p>
        <p className="loading-hint">同一事件，五种身份，五种看法</p>
      </div>
    )
  }

  const renderAvatar = (p, size = 'chip') => {
    const errorKey = `${size}_${p.name}`
    if (p.local_image && !avatarErrors[errorKey]) {
      return (
        <img 
          src={getLocalImagePath(p.local_image)} 
          alt={p.name} 
          className={size === 'chip' ? 'chip-avatar' : 'opinion-card-avatar'}
          onError={() => handleAvatarError(errorKey)}
        />
      )
    }
    return <span>{p.emoji}</span>
  }

  return (
    <div className="perspective-comparison">
      <div className="comparison-header">
        <h2 className="comparison-title font-serif">
          <span className="title-decoration">❖</span>
          棱镜圆桌会
          <span className="title-decoration">❖</span>
        </h2>
        <p className="comparison-subtitle">同一热点，五位身份，五种声音——你看到的世界，只是你选择的视角</p>

        <div className="perspective-chips">
          {perspectives.map((p, i) => (
            <button
              key={i}
              className={`perspective-chip ${highlightedPerspective?.name === p.name ? 'active' : ''}`}
              style={{
                borderColor: p.color,
                background: highlightedPerspective?.name === p.name ? p.color : 'transparent',
                color: highlightedPerspective?.name === p.name ? '#fff' : p.color
              }}
              onClick={() => handleHighlightedChange(p)}
            >
              {renderAvatar(p, 'chip')}
              {' '}{p.name}
            </button>
          ))}
        </div>
        {highlightedPerspective && (
          <p className="highlight-hint">已高亮 {highlightedPerspective.name} 的观点 · 点击其他身份切换</p>
        )}
      </div>

      <div className="news-tabs">
        {news.map((item, idx) => (
          <button
            key={item.id}
            className={`news-tab ${idx === activeNewsIndex ? 'active' : ''}`}
            onClick={() => {
              setActiveNewsIndex(idx)
              handleHighlightedChange(null)
            }}
          >
            {item.hot && <span className="tab-hot">热</span>}
            <span className="tab-title">{item.title.length > 16 ? item.title.slice(0, 16) + '...' : item.title}</span>
          </button>
        ))}
      </div>

      {currentNews && analysisData && (
        <div className={`comparison-content ${analysisData.collisionScore >= 60 ? 'high-collision' : ''}`}>
          <div className="collision-score-bar">
            <div className="collision-label">
              <span className="collision-icon">⚡</span>
              <span>观点碰撞度</span>
            </div>
            <div className="collision-meter">
              <div
                className="collision-fill"
                style={{
                  width: `${analysisData.collisionScore}%`,
                  background: analysisData.collisionScore >= 70
                    ? 'linear-gradient(90deg, #C0392B, #E74C3C, #FF8B7B)'
                    : analysisData.collisionScore >= 40
                    ? 'linear-gradient(90deg, #E67E22, #F39C12, #FFB347)'
                    : 'linear-gradient(90deg, #27AE60, #2ECC71, #FFB347)'
                }}
              />
            </div>
            <span className="collision-value">{analysisData.collisionScore}</span>
            <span className="collision-desc">
              {analysisData.collisionScore >= 70 ? '🔥 观点激烈碰撞' : analysisData.collisionScore >= 40 ? '⚡ 存在明显分歧' : '🤝 观点相对一致'}
            </span>
          </div>

          {(analysisData.consensus || analysisData.divergence) && (
            <div className="consensus-divergence">
              {analysisData.consensus && (
                <div className="consensus-item">
                  <span className="cd-icon">🤝</span>
                  <span className="cd-label">共识：</span>
                  <span className="cd-text">{analysisData.consensus}</span>
                </div>
              )}
              {analysisData.divergence && (
                <div className="divergence-item">
                  <span className="cd-icon">💥</span>
                  <span className="cd-label">分歧：</span>
                  <span className="cd-text">{analysisData.divergence}</span>
                </div>
              )}
            </div>
          )}

          <div className="attitude-overview">
            {['positive', 'negative', 'neutral'].map(type => {
              const count = analysisData.analyses.filter(a => a.attitude.attitude === type).length
              if (count === 0) return null
              const cfg = ATTITUDE_CONFIG[type]
              const pct = (count / analysisData.analyses.length) * 100
              return (
                <div key={type} className="attitude-bar-item" style={{ background: cfg.bg }}>
                  <span className="attitude-icon" style={{ color: cfg.color }}>{cfg.icon}</span>
                  <span className="attitude-label" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="attitude-count">{count}人</span>
                  <div className="attitude-mini-bar">
                    <div className="attitude-mini-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="comparison-news-header">
            <h3 className="comparison-news-title">{currentNews.title}</h3>
            <div className="comparison-news-meta">
              <span className="meta-source">{currentNews.source}</span>
              <span className="meta-views">阅读 {formatViews(currentNews.views)}</span>
            </div>
            <p className="comparison-news-summary">{currentNews.summary}</p>
          </div>

          <div className="opinions-grid">
            {analysisData.analyses.map((item, idx) => {
              const cfg = ATTITUDE_CONFIG[item.attitude.attitude]
              const isHighlighted = !highlightedPerspective || highlightedPerspective.name === item.perspective.name
              const attitudeClass = `attitude-${item.attitude.attitude}`
              return (
                <div
                  key={idx}
                  className={`opinion-card enhanced ${attitudeClass} ${isHighlighted ? 'highlighted' : 'dimmed'}`}
                  style={{ borderLeftColor: item.perspective.color }}
                  onClick={() => handleHighlightedChange(item.perspective)}
                >
                  <div className="opinion-card-header">
                    {renderAvatar(item.perspective, 'card')}
                    <span className="opinion-name" style={{ color: item.perspective.color }}>{item.perspective.name}</span>
                    <span
                      className="opinion-attitude-tag"
                      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                    >
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  <div className="opinion-keywords">
                    {item.keywords.map((kw, ki) => (
                      <span key={ki} className="opinion-keyword">#{kw}</span>
                    ))}
                  </div>

                  <p className="opinion-content font-serif">
                    "{item.opinion}"
                  </p>
                </div>
              )
            })}
          </div>

          <button
            className="read-more-btn"
            onClick={() => handleReadMore(currentNews)}
          >
            阅读完整报道 →
          </button>
        </div>
      )}

      <div className="comparison-footer">
        <p className="footer-quote font-serif">
          "棱镜折射七彩光，世界不止一个模样"
        </p>
      </div>
    </div>
  )
}

function formatViews(views) {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + '万'
  }
  return views
}

export default PerspectiveComparison
