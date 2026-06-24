import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getMockContentDetail, getMockRelatedContent } from '../mock/data'
import './ContentDetail.css'

function generateArticleBody(item) {
  if (item.content) return item.content
  const paras = [
    item.summary,
    `据${item.source}报道，近日，「${item.title}」一事引发广泛关注。记者多方走访了解到，这一现象背后折射出社会发展的多重面向，值得读者深入思考。`,
    `业内人士分析认为，此类情况并非个例，而是当前社会发展阶段的必然产物。随着经济社会持续发展，相关领域正在经历深刻变革，需要各方共同努力加以应对。`,
    `普通市民对此看法不一。有受访者表示支持，认为这是时代进步的体现；也有人持观望态度，建议相关部门出台更具体的配套措施，让政策真正落地见效。`,
    `据悉，有关部门已关注到相关情况，正在研究制定相应方案，预计近期将有进一步消息发布。本报将持续关注事件进展，为读者带来最新、最全面的报道。`
  ];
  return paras.join('\n\n');
}

function ContentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [content, setContent] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContent()
  }, [id, location.state])

  const loadContent = async () => {
    setLoading(true)

    const stateContent = location.state?.content
    if (stateContent) {
      const fullContent = {
        ...stateContent,
        content: generateArticleBody(stateContent),
        publish_time: stateContent.publish_time || '2026年6月24日',
        image_url: stateContent.image_url || stateContent.image,
      }
      setContent(fullContent)
      setRelated(getMockRelatedContent(id, null, 3))
      setLoading(false)
      return
    }

    try {
      const { getContentDetail, getRelatedContent } = await import('../api/content')
      const res = await getContentDetail(id)
      if (res.data) {
        setContent(res.data)
        const relatedRes = await getRelatedContent(id, res.data.perspective_name || null, 3)
        setRelated(relatedRes.data || [])
        setLoading(false)
        return
      }
    } catch (err) {
      console.log('API不可用，使用mock数据')
    }

    const mockData = getMockContentDetail(id)
    if (mockData) {
      mockData.content = generateArticleBody(mockData)
      setContent(mockData)
      setRelated(getMockRelatedContent(id, null, 3))
    }
    setLoading(false)
  }

  const handleLike = () => {}
  const handleFavorite = () => {}

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: content?.title,
        text: content?.summary,
        url: window.location.href,
      })
    } else {
      navigator.clipboard?.writeText(window.location.href)
      alert('链接已复制到剪贴板')
    }
  }

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-loading">正在排版...</div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="detail-page">
        <div className="detail-container">
          <nav className="breadcrumb">
            <button className="breadcrumb-link" onClick={() => navigate(-1)}>
              ◂ 返回版面
            </button>
          </nav>
          <div className="detail-loading">未找到该篇报道</div>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <div className="detail-container">
        <nav className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate(-1)}>
            ◂ 返回版面
          </button>
        </nav>

        <article className="detail-content">
          {content.image_url && (
            <div className="detail-image">
              <img src={content.image_url} alt={content.title} />
            </div>
          )}

          <h1 className="detail-title">{content.title}</h1>

          <div className="detail-meta">
            <span className="detail-source">{content.source}</span>
            <span className="detail-date">{content.publish_time}</span>
            <span className="detail-views">阅读 {formatViews(content.views || 0)}</span>
          </div>

          <div className="detail-summary">{content.summary}</div>

          <div className="detail-body">
            {content.content.split('\n\n').map((para, idx) => (
              <p key={idx} className="detail-paragraph">{para}</p>
            ))}
          </div>

          <div className="detail-actions">
            <button className="action-btn" onClick={handleLike}>
              <span className="action-icon">♡</span>
              <span>点赞</span>
            </button>
            <button className="action-btn" onClick={handleFavorite}>
              <span className="action-icon">✦</span>
              <span>收藏</span>
            </button>
            <button className="action-btn" onClick={handleShare}>
              <span className="action-icon">⌘</span>
              <span>分享</span>
            </button>
          </div>
        </article>

        {related.length > 0 && (
          <section className="related-section">
            <h3 className="related-title">相关阅读</h3>
            <div className="related-list">
              {related.map((item) => (
                <div key={item.id} className="related-item" onClick={() => navigate(`/content/${item.id}`, { state: { content: item } })}>
                  {item.image_url && (
                    <div className="related-image">
                      <img src={item.image_url} alt={item.title} />
                    </div>
                  )}
                  <div className="related-info">
                    <h4 className="related-item-title">{item.title}</h4>
                    <span className="related-source">{item.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
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

export default ContentDetail