import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getMockContentDetail, getMockRelatedContent, MOCK_ROLES, generateOpinion, getLocalImagePath, getCardImagePath } from '../mock/data'
import { useAppStore } from '../store/useAppStore'
import SharePoster from '../components/SharePoster'
import BreakthroughToast from '../components/BreakthroughToast'
import PrismRoundtable from '../components/PrismRoundtable'
import { analyzeAttitude, extractKeywords, ATTITUDE_CONFIG } from '../utils/opinionAnalyzer'
import { generateDeepOpinionByStyle } from '../utils/opinionGenerator'
import './ContentDetail.css'

const CATEGORY_EXTENSIONS = {
  tech: [
    '业内专家指出，这一技术进展并非孤立事件，而是近年来相关领域持续投入、厚积薄发的结果。从实验室突破到产业应用，通常需要经历三到五年的转化周期，而当前正处于关键的落地窗口期。多家头部企业已在该方向布局专利和产品线，预计未来一年内将有更多商业化产品面世。',
    '值得关注的是，技术迭代带来的不仅是效率提升，也伴随着就业结构、伦理边界和监管框架等方面的新挑战。有学者呼吁，在推动技术创新的同时，应当同步建立健全相关的法律法规和行业标准，确保技术发展始终沿着造福社会的方向前进，避免技术红利被少数群体独占。',
    '从国际竞争格局来看，全球主要经济体均在该领域加大研发投入，技术路线的选择和标准制定将深刻影响未来十年的产业分工。我国在部分细分领域已实现从跟跑到并跑甚至领跑的转变，但在基础研究和核心元器件方面仍存在短板，需要持续投入和长期积累。'
  ],
  society: [
    '此事经媒体报道后，迅速引发社会各界的广泛关注和热议。多位专家学者从不同角度进行了解读分析，普遍认为该事件具有一定的典型意义和代表性，反映了当前社会发展进程中值得关注的新动向、新问题，需要理性看待、妥善应对。',
    '记者在进一步调查中发现，事件背后牵涉的因素远比表面看到的复杂。从历史沿革到现实矛盾，从个体选择到制度设计，多种因素交织叠加，使得这一话题具备了持续讨论的公共价值。相关部门已对此事给予关注，表示将在充分调研的基础上研究制定相应措施。',
    '有观察人士指出，在信息传播高度发达的今天，公众对公共事件的关注度和参与度前所未有地提高。这既是社会进步的表现，也对信息甄别能力和理性讨论素养提出了更高要求。希望各方能够在尊重事实的基础上开展建设性对话，共同推动问题的妥善解决和社会的持续进步。'
  ]
}

function extendArticleBody(title, category, summary) {
  const categoryKey = category && CATEGORY_EXTENSIONS[category] ? category : 'society'
  const extensions = CATEGORY_EXTENSIONS[categoryKey] || CATEGORY_EXTENSIONS.society
  
  return [
    summary || `近日，"${title}"相关话题引发广泛讨论，各方观点不一。`,
    extensions[0],
    extensions[1],
    extensions[2]
  ]
}

function getOtherPerspectives(currentPerspName, count = 4) {
  return MOCK_ROLES.filter(r => r.name !== currentPerspName).sort(() => Math.random() - 0.5).slice(0, count)
}

function ContentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedPerspectives, incrementReadCount, resetSelection, pendingBreakthrough } = useAppStore()
  const [content, setContent] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSharePoster, setShowSharePoster] = useState(false)
  const [showRoundtable, setShowRoundtable] = useState(false)
  const [readCount, setReadCount] = useState(0)
  const [activePerspective, setActivePerspective] = useState(null)
  const [mainImgError, setMainImgError] = useState(false)
  const [relatedImgErrors, setRelatedImgErrors] = useState({})
  const [avatarErrors, setAvatarErrors] = useState({})
  const [prevNext, setPrevNext] = useState({ prev: null, next: null })
  const countedRef = useRef(false)

  const defaultPerspective = location.state?.perspective || (selectedPerspectives?.length === 1 ? selectedPerspectives[0] : (selectedPerspectives?.[0] || null))
  const [otherPersps, setOtherPersps] = useState(() => getOtherPerspectives(defaultPerspective?.name, 4))

  const currentPerspective = activePerspective || defaultPerspective

  const perspectiveOpinion = useMemo(() => {
    if (!content || !currentPerspective) return null
    return generateOpinion(currentPerspective, content)
  }, [content, currentPerspective])

  const deepOpinion = useMemo(() => {
    if (!content || !currentPerspective || !perspectiveOpinion) return null
    return generateDeepOpinionByStyle(currentPerspective, content, perspectiveOpinion)
  }, [content, currentPerspective, perspectiveOpinion])

  const opinionAnalysis = useMemo(() => {
    if (!deepOpinion) return null
    return analyzeAttitude(deepOpinion)
  }, [deepOpinion])

  const opinionKeywords = useMemo(() => {
    if (!perspectiveOpinion) return []
    return extractKeywords(perspectiveOpinion, 4)
  }, [perspectiveOpinion])

  const computePrevNext = (items) => {
    if (!items || items.length === 0) {
      setPrevNext({ prev: null, next: null })
      return
    }
    const currentId = parseInt(id, 10)
    const sortedItems = [...items].sort((a, b) => a.id - b.id)
    const currentIdx = sortedItems.findIndex(item => item.id === currentId)
    
    let prev = null
    let next = null
    
    if (currentIdx > 0) {
      prev = sortedItems[currentIdx - 1]
    } else if (sortedItems.length > 1) {
      prev = sortedItems[sortedItems.length - 1]
    }
    
    if (currentIdx < sortedItems.length - 1 && currentIdx !== -1) {
      next = sortedItems[currentIdx + 1]
    } else if (sortedItems.length > 1) {
      next = sortedItems[0]
    }
    
    setPrevNext({ prev, next })
  }

  useEffect(() => {
    countedRef.current = false
    setLoading(true)
    setMainImgError(false)
    setRelatedImgErrors({})
    setAvatarErrors({})
    setActivePerspective(null)
    setOtherPersps(getOtherPerspectives(defaultPerspective?.name, 4))
    window.scrollTo({ top: 0, behavior: 'auto' })
    loadContent()
  }, [id, location.state])

  useEffect(() => {
    if (content && !countedRef.current) {
      incrementReadCount()
      setReadCount(prev => prev + 1)
      countedRef.current = true
    }
  }, [content])

  const loadContent = async () => {
    setLoading(true)

    const stateContent = location.state?.content
    if (stateContent) {
      const summary = stateContent.summary || ''
      const bodyParagraphs = summary.length < 100
        ? extendArticleBody(stateContent.title, stateContent.category, summary)
        : [summary]

      const fullContent = {
        ...stateContent,
        content: bodyParagraphs.join('\n\n'),
        _bodyParagraphs: bodyParagraphs,
        publish_time: stateContent.publish_time || '2026年6月25日',
        image_url: stateContent.image_url || stateContent.image,
      }
      setContent(fullContent)
      const relatedItems = getMockRelatedContent(id, null, 3)
      setRelated(relatedItems)
      setOtherPersps(getOtherPerspectives(defaultPerspective?.name, 4))
      computePrevNext(relatedItems)
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
        setOtherPersps(getOtherPerspectives(defaultPerspective?.name, 4))
        computePrevNext(relatedRes.data || [])
        setLoading(false)
        return
      }
    } catch (err) {
      // API unavailable, using mock data
    }

    const mockDetail = getMockContentDetail(id, defaultPerspective)
    if (mockDetail) {
      setContent(mockDetail)
      const relatedItems = getMockRelatedContent(id, defaultPerspective?.name, 3)
      setRelated(relatedItems)
      setOtherPersps(getOtherPerspectives(defaultPerspective?.name, 4))
      computePrevNext(relatedItems)
      setLoading(false)
      return
    }

    setContent(null)
    setLoading(false)
  }

  const handleAvatarError = (key) => {
    setAvatarErrors(prev => ({ ...prev, [key]: true }))
  }

  const getAvatarUrl = (p, prefix = 'main') => {
    const cardKey = `${prefix}_card_${p.name}`
    const localKey = `${prefix}_local_${p.name}`
    
    if (p.card_image && !avatarErrors[cardKey]) {
      return { url: getCardImagePath(p.card_image), isCard: true, key: cardKey }
    }
    if (p.local_image && !avatarErrors[localKey]) {
      return { url: getLocalImagePath(p.local_image), isCard: false, key: localKey }
    }
    return null
  }

  const renderAvatar = (p, prefix = 'main', className = '') => {
    const avatarData = getAvatarUrl(p, prefix)
    if (avatarData) {
      return (
        <img 
          src={avatarData.url}
          alt={p.name}
          className={className}
          onError={() => handleAvatarError(avatarData.key)}
        />
      )
    }
    return <span className={`${className}-emoji`}>{p.emoji}</span>
  }

  const handleSwitchPerspective = (p) => {
    setActivePerspective(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleResetPerspective = () => {
    setActivePerspective(null)
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

  const handleDrawMore = () => {
    resetSelection()
    navigate('/')
  }

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate('/discover')
    }
  }

  const handleRelatedImageError = (itemId) => {
    setRelatedImgErrors(prev => ({ ...prev, [itemId]: true }))
  }

  const handlePrevNext = (item) => {
    if (!item) return
    navigate(`/content/${item.id}`, { state: { content: item, perspective: currentPerspective } })
  }

  const renderBodyParagraphs = () => {
    const bodyParas = content._bodyParagraphs
      ? content._bodyParagraphs.filter(p => p && p.trim())
      : (content.content || '').split('\n\n').filter(p => p.trim() && !p.startsWith('【棱镜视角'))

    return bodyParas.map((para, idx) => (
      <p key={idx} className={`detail-paragraph ${idx === 0 ? 'first-paragraph' : ''}`}>
        {idx === 0 && para.charAt(0) && <span className="drop-cap">{para.charAt(0)}</span>}
        {idx === 0 ? para.slice(1) : para}
      </p>
    ))
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
            <button className="breadcrumb-link" onClick={handleBack}>
              ← 返回列表
            </button>
          </nav>
          <div className="empty-state">
            <p className="empty-icon">📰</p>
            <p className="empty-text">未找到该篇报道</p>
            <button className="empty-action" onClick={handleDrawMore}>换个身份看世界</button>
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
          <button className="breadcrumb-link" onClick={handleBack}>
            ← 返回列表
          </button>
        </nav>

        <article className="detail-content">
          {content.image_url && !mainImgError && (
            <div className="detail-image">
              <img src={content.image_url} alt={content.title} onError={() => setMainImgError(true)} />
            </div>
          )}
          {mainImgError && (
            <div className="detail-image detail-image-fallback">📰</div>
          )}

          <h1 className="detail-title font-serif">{content.title}</h1>

          <div className="detail-meta">
            <span className="detail-source">{content.source}</span>
            <span className="detail-date">{content.publish_time}</span>
            <span className="detail-views">阅读 {formatViews(content.views || 0)}</span>
          </div>

          <div className="detail-body font-serif">
            {renderBodyParagraphs()}
          </div>

          {currentPerspective && deepOpinion && (
            <div className={`prism-perspective-block attitude-${opinionAnalysis.attitude}`}>
              <div className="prism-block-header">
                <span className="prism-icon">◈</span>
                {renderAvatar(currentPerspective, 'main', 'prism-avatar')}
                <span className="prism-label">棱镜深度 · {currentPerspective.name} 独家解读</span>
                <span className="ai-generated-badge" title="由AI基于角色人设动态生成">⚡ AI 深度</span>
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
                {deepOpinion.split('\n\n').filter(p => p.trim()).map((para, pIdx) => (
                  <p key={pIdx} className={`prism-opinion-text font-serif ${pIdx === 0 ? 'first-deep-para' : ''}`}>
                    {pIdx === 0 && para.charAt(0) && <span className="drop-cap">{para.charAt(0)}</span>}
                    {pIdx === 0 ? para.slice(1) : para}
                  </p>
                ))}
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
                  const avatarKey = `other_${p.name}`
                  return (
                    <button
                      key={idx}
                      className={`other-persp-item ${isActive ? 'active' : ''}`}
                      style={{ borderLeftColor: pCfg.color, borderLeftWidth: isActive ? '4px' : '3px' }}
                      onClick={() => isActive ? handleResetPerspective() : handleSwitchPerspective(p)}
                    >
                      <div className="other-persp-name">
                        {renderAvatar(p, avatarKey, 'other-persp-avatar')}
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
                <button className="see-more-btn" onClick={handleDrawMore}>
                  换个身份看世界 →
                </button>
              </div>
            </div>
          )}

          <div className="detail-actions">
            <button className="action-btn" onClick={() => setShowSharePoster(true)}>
              <span className="action-icon">⌘</span>
              <span>生成海报</span>
            </button>
            <button className="action-btn action-btn-roundtable" onClick={() => setShowRoundtable(true)}>
              <span className="action-icon">❖</span>
              <span>棱镜圆桌会</span>
            </button>
            <button className="action-btn" onClick={handleShare}>
              <span className="action-icon">⇗</span>
              <span>分享链接</span>
            </button>
          </div>
        </article>

        <nav className="detail-nav">
          {prevNext.prev && (
            <button className="nav-btn nav-prev" onClick={() => handlePrevNext(prevNext.prev)}>
              <span className="nav-arrow">←</span>
              <span className="nav-label">上一篇</span>
              <span className="nav-title font-serif">{prevNext.prev.title}</span>
            </button>
          )}
          {prevNext.next && (
            <button className="nav-btn nav-next" onClick={() => handlePrevNext(prevNext.next)}>
              <span className="nav-label">下一篇</span>
              <span className="nav-arrow">→</span>
              <span className="nav-title font-serif">{prevNext.next.title}</span>
            </button>
          )}
        </nav>

        <div className="detail-bottom-cta">
          <button className="cta-btn" onClick={handleDrawMore}>
            ✦ 换个身份看世界 ✦
          </button>
          <button className="cta-btn cta-btn-secondary" onClick={handleBack}>
            ← 返回版面
          </button>
        </div>

        {related.length > 0 && (
          <section className="related-section">
            <h3 className="related-title font-serif">— 相关阅读 —</h3>
            <div className="related-list">
              {related.map((item) => (
                <div key={item.id} className="related-item" onClick={() => navigate(`/content/${item.id}`, { state: { content: item, perspective: currentPerspective } })}>
                  {item.image_url && !relatedImgErrors[item.id] ? (
                    <div className="related-image">
                      <img src={item.image_url} alt={item.title} loading="lazy" onError={() => handleRelatedImageError(item.id)} />
                    </div>
                  ) : (
                    <div className="related-image related-image-fallback">📰</div>
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

      {showRoundtable && (
        <PrismRoundtable
          onClose={() => setShowRoundtable(false)}
        />
      )}

      <BreakthroughToast
        readCount={readCount}
        perspectives={selectedPerspectives}
      />
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
