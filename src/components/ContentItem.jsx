import React from 'react'
import { useNavigate } from 'react-router-dom'
import './ContentItem.css'

function ContentItem({ content, index }) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/content/${content.id}`, { state: { content } })
  }

  const imageUrl = content.image_url || content.image
  const views = typeof content.views === 'number' ? formatViews(content.views) : content.views

  return (
    <article
      className="content-item"
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={handleClick}
    >
      <div className="item-image">
        <img src={imageUrl} alt={content.title} loading="lazy" />
        {content.hot && <span className="hot-badge">独家</span>}
      </div>
      <div className="item-content">
        <h3 className="item-title">{content.title}</h3>
        <p className="item-summary">{content.summary}</p>
        <div className="item-footer">
          <div className="item-meta">
            <span className="item-source">{content.source}</span>
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
