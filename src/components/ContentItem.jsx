import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { analyzeAttitude, extractKeywords, ATTITUDE_CONFIG } from '../utils/opinionAnalyzer'
import { getLocalImagePath } from '../mock/data'
import './ContentItem.css'

function ContentItem({ content, index, perspective: perspectiveProp }) {
  const navigate = useNavigate()
  const { selectedPerspectives } = useAppStore()
  const [imgError, setImgError] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  const perspective = perspectiveProp || (selectedPerspectives?.length === 1 ? selectedPerspectives[0] : (selectedPerspectives?.[0] || null))

  const handleClick = () => {
    navigate(`/content/${content.id}`, { state: { content, perspective } })
  }

  const handleImageError = () => {
    setImgError(true)
  }

  const imageUrl = content.image_url || content.image
  const views = typeof content.views === 'number' ? formatViews(content.views) : (content.views || '0')
  const source = content.source || '综合资讯'
  const publishTime = content.publish_time || ''
  const showOpinion = content.opinion && perspective
  const opinionAnalysis = showOpinion ? analyzeAttitude(content.opinion) : null
  const opinionKeywords = showOpinion ? extractKeywords(content.opinion, 3) : []
  const attitudeCfg = opinionAnalysis ? ATTITUDE_CONFIG[opinionAnalysis.attitude] : null

  return (
    <article
      className="content-item"
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={handleClick}
    >
      <div className="item-image">
        {imageUrl && !imgError ? (
          <img src={imageUrl} alt={content.title} loading="lazy" onError={handleImageError} />
        ) : (
          <div className="item-image-fallback">📰</div>
        )}
        {content.hot && <span className="hot-badge">热</span>}
        {content.perspectiveRelevance === 'high' && <span className="relevance-badge">关注</span>}
      </div>
      <div className="item-content">
        <h3 className="item-title">{content.title || '无标题'}</h3>
        <p className="item-summary">{content.summary || ''}</p>
        
        {showOpinion && (
          <div className={`prism-opinion attitude-${opinionAnalysis.attitude}`}>
            <div className="opinion-header">
              <span className="opinion-label">
                <span className="opinion-icon-diamond">◈</span>
                {perspective.local_image && !avatarError ? (
                  <img 
                    src={getLocalImagePath(perspective.local_image)} 
                    alt={perspective.name}
                    className="opinion-avatar"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="opinion-emoji">{perspective.emoji}</span>
                )}
                <span className="opinion-name">{perspective.name}</span>
              </span>
              {attitudeCfg && (
                <span 
                  className="attitude-badge"
                  style={{ background: attitudeCfg.bg, color: attitudeCfg.color, borderColor: attitudeCfg.border }}
                >
                  {attitudeCfg.icon} {attitudeCfg.label}
                </span>
              )}
            </div>
            <p className="opinion-text">"{content.opinion}"</p>
            {opinionKeywords.length > 0 && (
              <div className="opinion-keywords-mini">
                {opinionKeywords.map((kw, ki) => (
                  <span key={ki} className="keyword-mini">#{kw}</span>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="item-footer">
          <div className="item-meta">
            <span className="item-source">{source}</span>
            {publishTime && <span className="item-time">{publishTime}</span>}
            <span className="item-views">阅读 {views}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

function formatViews(views) {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + '万'
  }
  return views
}

export default ContentItem
