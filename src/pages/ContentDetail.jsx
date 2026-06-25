import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getMockContentDetail, getMockRelatedContent, MOCK_ROLES, generateOpinion, getLocalImagePath } from '../mock/data'
import { useAppStore } from '../store/useAppStore'
import SharePoster from '../components/SharePoster'
import BreakthroughModal from '../components/BreakthroughModal'
import { analyzeAttitude, extractKeywords, ATTITUDE_CONFIG } from '../utils/opinionAnalyzer'
import './ContentDetail.css'

function generateArticleBody(item, perspective) {
  const mainOpinion = perspective ? generateOpinion(perspective, item) : ''
  const paras = [
    item.summary,
    `据${item.source}报道，近日，「${item.title}」一事引发广泛关注。记者多方走访了解到，这一现象背后折射出社会发展的多重面向，值得读者深入思考。`,
    `业内人士分析认为，此类情况并非个例，而是当前社会发展阶段的必然产物。随着经济社会持续发展，相关领域正在经历深刻变革，需要各方共同努力加以应对。`,
    `普通市民对此看法不一。有受访者表示支持，认为这是时代进步的体现；也有人持观望态度，建议相关部门出台更具体的配套措施，让政策真正落地见效。`,
    `据悉，有关部门已关注到相关情况，正在研究制定相应方案，预计近期将有进一步消息发布。本报将持续关注事件进展，为读者带来最新、最全面的报道。`
  ]

  if (mainOpinion && !item.content?.includes('棱镜视角')) {
    paras.push('')
    paras.push(`【棱镜视角 · ${perspective.name}】`)
    paras.push(mainOpinion)
  }

  if (item.content) return item.content
  return paras.join('\n\n')
}

function getOtherPerspectives(currentPerspName, count = 4) {
  return MOCK_ROLES.filter(r => r.name !== currentPerspName).sort(() => Math.random() - 0.5).slice(0, count)
}

function ContentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedPerspectives, incrementReadCount } = useAppStore()
  const [content, setContent] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSharePoster, setShowSharePoster] = useState(false)
  const [showBreakthrough, setShowBreakthrough] = useState(false)
  const [breakthroughData, setBreakthroughData] = useState(null)
  const [activePerspective, setActivePerspective] = useState(null)
  const countedRef = useRef(false)

  const defaultPerspective = location.state?.perspective || (selectedPerspectives?.length === 1 ? selectedPerspectives[0] : (selectedPerspectives?.[0] || null))
  const [otherPersps, setOtherPersps] = useState(() => getOtherPerspectives(defaultPerspective?.name, 4))

  const currentPerspective = activePerspective || defaultPerspective

  const perspectiveOpinion = useMemo(() => {
    if (!content || !currentPerspective) return null
    return generateOpinion(currentPerspective, content)
  }, [content, currentPerspective])

  const opinionAnalysis = useMemo(() => {
    return perspectiveOpinion ? analyzeAttitude(perspectiveOpinion) : null
  }, [perspectiveOpinion])

  const opinionKeywords = useMemo(() => {
    return perspectiveOpinion ? extractKeywords(perspectiveOpinion, 5) : []
  }, [perspectiveOpinion])

  useEffect(() => {
    loadContent()
    countedRef.current = false
    setActivePerspective(null)
  }, [id, location.state])

  useEffect(() => {
    if (content && !countedRef.current) {
      countedRef.current = true
      const result = incrementReadCount()
      if (result.achieved) {
        setTimeout(() => {
          setBreakthroughData({ readCount: result.newCount })
          setShowBreakthrough(true)
        }, 800)
      }
    }
  }, [content])

  const loadContent = async () => {
    setLoading(true)

    const stateContent = location.state?.content
    if (stateContent) {
      const fullContent = {
        ...stateContent,
        content: generateArticleBody(stateContent, defaultPerspective),
        publish_time: stateContent.publish_time || '2026年6月25日',
        image_url: stateContent.image_url || stateContent.image,
      }
      setContent(fullContent)
      setRelated(getMockRelatedContent(id, null, 3))
      setOtherPersps(getOtherPerspectives(defaultPerspective?.name, 4))
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

    const mockData = getMockContentDetail(id, defaultPerspective)
    if (mockData) {
      mockData.content = generateArticleBody(mockData, defaultPerspective)
      setContent(mockData)
      setRelated(getMockRelatedContent(id, null, 3))
      setOtherPersps(getOtherPerspectives(defaultPerspective?.name, 4))
    }
    setLoading(false)
  }

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

  const handleSwitchPerspective = (persp) => {
    setActivePerspective(persp)
    window.scrollTo({ top: document.querySelector('.prism-perspective-block')?.offsetTop - 80 || 0, behavior: 'smooth' })
  }

  const handleResetPerspective = () => {
    setActivePerspective(null)
  }

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-loading">
          <div className="loading-spinner"></div>
          <p>正在排版...</p>
        </div>
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
          <div className="empty-state">
            <p className="empty-icon">📰</p>
            <p className="empty-text">未找到该篇报道</p>
            <button className="empty-action" onClick={() => navigate('/')}>返回首页</button>
          </div>
        </div>
      </div>
    )
  }

  const attitudeCfg = opinionAnalysis ? ATTITUDE_CONFIG[opinionAnalysis.attitude] : null

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

          <h1 className="detail-title font-serif">{content.title}</h1>

          <div className="detail-meta">
            <span className="detail-source">{content.source}</span>
            <span className="detail-date">{content.publish_time}</span>
            <span className="detail-views">阅读 {formatViews(content.views || 0)}</span>
          </div>

          <div className="detail-summary font-serif">{content.summary}</div>

          {currentPerspective && perspectiveOpinion && (
            <div className={`prism-perspective-block attitude-${opinionAnalysis.attitude}`}>
              <div className="prism-block-header">
                <span className="prism-icon">◈</span>
                {currentPerspective.local_image && (
                  <img 
                    src={getLocalImagePath(currentPerspective.local_image)} 
                    alt={currentPerspective.name}
                    className="prism-avatar"
                  />
                )}
                <span className="prism-label">棱镜视角 · {currentPerspective.name} 独家解读</span>
                <span className="ai-generated-badge" title="由AI基于角色人设动态生成">⚡ AI 视角</span>
                {attitudeCfg && (
                  <span 
                    className="attitude-badge-large"
                    style={{ background: attitudeCfg.bg, color: attitudeCfg.color, borderColor: attitudeCfg.border }}
                  >
                    {attitudeCfg.icon} {attitudeCfg.label}
                  </span>
                )}
              </div>
              <div className="prism-block-content">
                <p className="prism-opinion-text font-serif">
                  <span className="drop-cap">{perspectiveOpinion.charAt(0)}</span>
                  {perspectiveOpinion.slice(1)}
                </p>
                {opinionKeywords.length > 0 && (
                  <div className="opinion-keywords">
                    {opinionKeywords.map((kw, ki) => (
                      <span key={ki} className="keyword-tag">#{kw}</span>
                    ))}
                  </div>
                )}
                <div className="prism-bio">
                  <span className="bio-tag">{currentPerspective.description}</span>
                </div>
              </div>
            </div>
          )}

          <div className="detail-body font-serif">
            {content.content.split('\n\n').filter(p => p.trim() && !p.startsWith('【棱镜视角')).map((para, idx) => (
              <p key={idx} className={`detail-paragraph ${idx === 0 ? 'first-paragraph' : ''}`}>
                {idx === 0 && para.charAt(0) && <span className="drop-cap">{para.charAt(0)}</span>}
                {idx === 0 ? para.slice(1) : para}
              </p>
            ))}
          </div>

          {otherPersps.length > 0 && (
            <div className="other-perspectives-block">
              <div className="other-persp-header">
                <span className="other-persp-icon">❖</span>
                <span className="other-persp-title">其他身份怎么看？</span>
                <span className="other-persp-hint">点击切换视角</span>
              </div>
              <div className="other-persp-list">
                {otherPersps.map((p, idx) => {
                  const pOpinion = generateOpinion(p, content)
                  const pAttitude = analyzeAttitude(pOpinion)
                  const pCfg = ATTITUDE_CONFIG[pAttitude.attitude]
                  const isActive = activePerspective?.name === p.name
                  return (
                    <button
                      key={idx}
                      className={`other-persp-item ${isActive ? 'active' : ''}`}
                      style={{ borderLeftColor: pCfg.color, borderLeftWidth: isActive ? '4px' : '3px' }}
                      onClick={() => isActive ? handleResetPerspective() : handleSwitchPerspective(p)}
                    >
                      <div className="other-persp-name">
                        {p.local_image ? (
                          <img 
                            src={getLocalImagePath(p.local_image)} 
                            alt={p.name}
                            className="other-persp-avatar"
                          />
                        ) : (
                          <span className="other-persp-emoji">{p.emoji}</span>
                        )}
                        <span className="other-persp-name-text">{p.name}</span>
                        <span className="other-persp-attitude" style={{ color: pCfg.color, background: pCfg.bg }}>
                          {pCfg.icon}
                        </span>
                      </div>
                      <p className="other-persp-quote font-serif">"{pOpinion}"</p>
                    </button>
                  )
                })}
              </div>
              <div className="other-persp-footer">
                <button className="see-more-btn" onClick={() => navigate('/')}>
                  抽取更多身份 →
                </button>
              </div>
            </div>
          )}

          <div className="detail-actions">
            <button className="action-btn" onClick={() => setShowSharePoster(true)}>
              <span className="action-icon">⌘</span>
              <span>生成海报</span>
            </button>
            <button className="action-btn" onClick={handleShare}>
              <span className="action-icon">⇗</span>
              <span>分享链接</span>
            </button>
          </div>
        </article>

        {related.length > 0 && (
          <section className="related-section">
            <h3 className="related-title font-serif">— 相关阅读 —</h3>
            <div className="related-list">
              {related.map((item) => (
                <div key={item.id} className="related-item" onClick={() => navigate(`/content/${item.id}`, { state: { content: item, perspective: currentPerspective } })}>
                  {item.image_url && (
                    <div className="related-image">
                      <img src={item.image_url} alt={item.title} loading="lazy" />
                    </div>
                  )}
                  <div className="related-info">
                    <h4 className="related-item-title font-serif">{item.title}</h4>
                    <span className="related-source">{item.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {showSharePoster && currentPerspective && (
        <SharePoster
          perspective={currentPerspective}
          opinion={perspectiveOpinion}
          newsTitle={content?.title}
          onClose={() => setShowSharePoster(false)}
        />
      )}

      {showBreakthrough && breakthroughData && (
        <BreakthroughModal
          readCount={breakthroughData.readCount}
          perspectives={selectedPerspectives}
          onClose={() => setShowBreakthrough(false)}
        />
      )}
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
