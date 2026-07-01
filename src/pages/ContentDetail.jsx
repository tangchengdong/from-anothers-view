import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getLocalImagePath, getCardImagePath } from '../mock/data'
import { getCommentary, getDeepCommentary, getContentDetail, getRelatedContent, suggestPerspectives, streamCommentary } from '../api/content'
import { useAppStore } from '../store/useAppStore'
import SharePoster from '../components/SharePoster'
import BreakthroughToast from '../components/BreakthroughToast'
import { analyzeAttitude, extractKeywords, ATTITUDE_CONFIG } from '../utils/opinionAnalyzer'
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

function ContentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedPerspectives, incrementReadCount, resetSelection, pendingBreakthrough } = useAppStore()
  const [content, setContent] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSharePoster, setShowSharePoster] = useState(false)
  const [hasSelectedRole, setHasSelectedRole] = useState(false)
  const [readCount, setReadCount] = useState(0)
  const [activePerspective, setActivePerspective] = useState(null)
  const [mainImgError, setMainImgError] = useState(false)
  const [relatedImgErrors, setRelatedImgErrors] = useState({})
  const [avatarErrors, setAvatarErrors] = useState({})
  const [prevNext, setPrevNext] = useState({ prev: null, next: null })
  const [perspectives, setPerspectives] = useState([])
  const [perspectiveOpinion, setPerspectiveOpinion] = useState(null)
  const [opinionLoading, setOpinionLoading] = useState(false)
  const [opinionError, setOpinionError] = useState(null)
  const [deepOpinion, setDeepOpinion] = useState(null)
  const [deepLoading, setDeepLoading] = useState(false)
  const [deepError, setDeepError] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamRetryCount, setStreamRetryCount] = useState(0)
  const countedRef = useRef(false)
  const pendingPerspectiveRef = useRef(null)
  const streamRef = useRef(null)
  const contentRef = useRef(null) // 始终持有最新 content，避免闭包陈旧值
  const retryAttemptRef = useRef(0) // 当前重试次数
  const MAX_STREAM_RETRY = 3 // 流式输出最多自动重试3次

  const currentPerspective = activePerspective

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
    contentRef.current = null
    pendingPerspectiveRef.current = null
    setLoading(true)
    setMainImgError(false)
    setRelatedImgErrors({})
    setAvatarErrors({})
    setActivePerspective(null)
    setHasSelectedRole(false)
    setPerspectiveOpinion(null)
    setDeepOpinion(null)
    setOpinionError(null)
    setDeepError(null)
    setOpinionLoading(false)
    setDeepLoading(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
    loadContent().catch(err => {
      console.error('loadContent 调用失败:', err)
      setLoading(false)
    })
  }, [id, location.state])

  useEffect(() => {
    if (content && !countedRef.current) {
      incrementReadCount()
      setReadCount(prev => prev + 1)
      countedRef.current = true
    }
  }, [content])
  
  // 当 content 加载完成时，检查是否有挂起的评论加载
  useEffect(() => {
    if (content && pendingPerspectiveRef.current && hasSelectedRole) {
      loadPerspectiveCommentary(pendingPerspectiveRef.current)
      pendingPerspectiveRef.current = null
    }
  }, [content])

  // 加载视角角色池
  useEffect(() => {
    let cancelled = false
    const statePerspective = location.state?.perspective
    
    const loadPerspectives = async () => {
      try {
        const res = await suggestPerspectives(12)
        if (!cancelled) {
          const list = res?.data || (Array.isArray(res) ? res : [])
          setPerspectives(Array.isArray(list) ? list : [])
          
          // 优先使用 state 中传递的 perspective
          if (statePerspective && !hasSelectedRole) {
            // 检查 statePerspective 是否在列表中，不在的话补进去
            let targetPerspective = list.find(p => p.name === statePerspective.name)
            if (!targetPerspective) {
              targetPerspective = statePerspective
              setPerspectives([targetPerspective, ...list])
            }
            handleSelectRole(targetPerspective)
          } 
          // 否则默认选中第一个视角
          else if (Array.isArray(list) && list.length > 0 && !hasSelectedRole) {
            handleSelectRole(list[0])
          }
        }
      } catch (err) {
        // 视角池加载失败，但如果有 statePerspective 还是要选中它
        if (statePerspective && !hasSelectedRole) {
          setPerspectives([statePerspective])
          handleSelectRole(statePerspective)
        }
      }
    }
    loadPerspectives()
    return () => { cancelled = true }
  }, [id])

  // 用户选择视角后，懒加载该视角的短评与深度解读
  const handleSelectRole = async (p) => {
    setActivePerspective(p)
    setHasSelectedRole(true)

    // 使用 ref 读取最新 content，避免闭包陈旧值导致逻辑错乱
    if (!contentRef.current) {
      pendingPerspectiveRef.current = p
      return
    }

    await loadPerspectiveCommentary(p)
  }
  
  // 加载指定角色的评论 — 直接流式输出，带自动重试
  const loadPerspectiveCommentary = async (p, attempt = 1) => {
    // 关闭之前的 stream
    if (streamRef.current) {
      streamRef.current.close()
      streamRef.current = null
    }

    retryAttemptRef.current = attempt
    setStreamRetryCount(attempt)

    // 重置状态
    setDeepLoading(true)
    setDeepError(null)
    setDeepOpinion(null)
    setIsStreaming(true)
    setPerspectiveOpinion(null)

    const currentContent = contentRef.current
    if (!currentContent) {
      setDeepLoading(false)
      setIsStreaming(false)
      setDeepError(new Error('内容未就绪'))
      return
    }

    let fullContent = ''
    let streamClosed = false
    let hasReceivedChunk = false

    try {
      const es = streamCommentary(currentContent.id, p.name, {
        onThinking: (role) => {
          // 思考中状态，已由 isStreaming 控制展示
        },
        onChunk: (chunk) => {
          hasReceivedChunk = true
          fullContent += chunk
          setDeepOpinion(fullContent)
        },
        onDone: (finalContent) => {
          streamClosed = true
          setDeepOpinion(finalContent)
          setIsStreaming(false)
          setDeepLoading(false)
          setDeepError(null)
          streamRef.current = null
          // 短评也用流式结果的前两句
          const short = (finalContent || '').split('\n\n')[0] || finalContent || ''
          setPerspectiveOpinion(short.slice(0, 100))
        },
        onError: (e) => {
          console.error('流式评论失败（第' + attempt + '次）:', e)
          streamClosed = true
          streamRef.current = null
          setIsStreaming(false)

          // 自动重试：最多 MAX_STREAM_RETRY 次，还没收到过数据才重试（避免重复输出）
          if (!hasReceivedChunk && attempt < MAX_STREAM_RETRY) {
            setDeepLoading(true)
            setTimeout(() => {
              loadPerspectiveCommentary(p, attempt + 1)
            }, 800)
          } else if (attempt >= MAX_STREAM_RETRY) {
            // 重试耗尽，回退到非流式
            fallbackLoadDeepOpinion(p)
          }
        }
      }, 'deep')

      streamRef.current = es

      // 超时保护：80秒
      let waitTime = 0
      while (!streamClosed && waitTime < 80000) {
        await new Promise(resolve => setTimeout(resolve, 100))
        waitTime += 100
      }

      if (!streamClosed) {
        setIsStreaming(false)
        setDeepLoading(false)
        // 超时也触发重试或回退
        if (attempt < MAX_STREAM_RETRY && !hasReceivedChunk) {
          setDeepLoading(true)
          setTimeout(() => {
            loadPerspectiveCommentary(p, attempt + 1)
          }, 800)
        } else if (attempt >= MAX_STREAM_RETRY) {
          fallbackLoadDeepOpinion(p)
        }
      }
    } catch (err) {
      console.error('加载评论错误:', err)
      setIsStreaming(false)
      streamRef.current = null
      if (attempt < MAX_STREAM_RETRY) {
        setDeepLoading(true)
        setTimeout(() => {
          loadPerspectiveCommentary(p, attempt + 1)
        }, 800)
      } else {
        fallbackLoadDeepOpinion(p)
      }
    }
  }

  // 回退加载策略
  const fallbackLoadDeepOpinion = async (p) => {
    setDeepLoading(true)
    try {
      const data = await getDeepCommentary(content.id, p.name)
      setDeepOpinion(data.deep_commentary || '')
    } catch (err) {
      setDeepError(err)
    } finally {
      setDeepLoading(false)
    }
  }

  const loadContent = async () => {
    setLoading(true)

    try {
      const stateContent = location.state?.content
      const statePerspective = location.state?.perspective
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
        contentRef.current = fullContent
        // 渐进式加载：主内容就绪即关闭 loading，相关阅读后台异步加载
        setLoading(false)

        // 后台加载相关阅读与上下篇（不阻塞主内容展示）
        getRelatedContent(id, null, 3)
          .then((relatedRes) => {
            const relatedItems = relatedRes?.data || []
            setRelated(relatedItems)
            computePrevNext(relatedItems)
          })
          .catch(() => {
            setRelated([])
            setPrevNext({ prev: null, next: null })
          })

        // 如果有 state 中传的 perspective，优先使用
        if (statePerspective) {
          pendingPerspectiveRef.current = statePerspective
        }
        return
      }

      const res = await getContentDetail(id)
      const detail = res?.data
      if (detail) {
        setContent(detail)
        contentRef.current = detail
        // 渐进式加载：主内容就绪即关闭 loading
        setLoading(false)

        getRelatedContent(id, detail.perspective_name || null, 3)
          .then((relatedRes) => {
            const relatedItems = relatedRes?.data || []
            setRelated(relatedItems)
            computePrevNext(relatedItems)
          })
          .catch(() => {
            setRelated([])
            setPrevNext({ prev: null, next: null })
          })
        return
      }
      // 接口返回但无数据
      setContent(null)
      contentRef.current = null
      setLoading(false)
    } catch (err) {
      console.error('加载内容失败:', err)
      // 接口不可用：使用 location.state 中的最小信息或显示错误
      setContent(null)
      contentRef.current = null
      setLoading(false)
    }
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
          <p>正在准备视角...</p>
          <p className="loading-hint">挑选身份 · 整理资讯 · 即将就绪</p>
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

          {/* 角色选择栏 */}
          {perspectives.length > 0 && (
            <div className="role-selector-bar">
              <div className="role-selector-label">选择视角解读：</div>
              <div className="role-chips-scroll">
                {perspectives.map((p, idx) => {
                  const isActive = currentPerspective?.name === p.name
                  const avatar = getAvatarUrl(p, `role_${idx}`)
                  return (
                    <button
                      key={idx}
                      className={`role-chip ${isActive ? 'active' : ''}`}
                      style={{ borderColor: p.color || '#64748B' }}
                      onClick={() => handleSelectRole(p)}
                    >
                      {avatar ? (
                        <img
                          src={avatar.url}
                          alt={p.name}
                          className="role-chip-avatar"
                          onError={() => handleAvatarError(avatar.key)}
                        />
                      ) : (
                        <span className="role-chip-emoji">{p.emoji}</span>
                      )}
                      <span className="role-chip-name" style={{ color: isActive ? p.color : undefined }}>{p.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {currentPerspective && (
            <div className={`prism-perspective-block attitude-${opinionAnalysis?.attitude || 'neutral'} ${isStreaming ? 'streaming-glow' : ''}`}>
              <div className="prism-block-header">
                <span className="prism-icon">◈</span>
                {renderAvatar(currentPerspective, 'main', 'prism-avatar')}
                <span className="prism-label">棱镜深度 · {currentPerspective.name} 独家解读</span>
                <span className="ai-generated-badge" title="由AI基于角色人设动态生成">
                  {isStreaming ? `⚡ 生成中 ${streamRetryCount > 1 ? `(第${streamRetryCount}次重试)` : ''}` : '⚡ AI 深度'}
                </span>
                {attitudeCfg && !isStreaming && deepOpinion && (
                  <span
                    className="attitude-badge-large"
                    style={{ background: attitudeCfg.bg, color: attitudeCfg.color, borderColor: attitudeCfg.border }}
                  >
                    {attitudeCfg.icon} {attitudeCfg.label}
                  </span>
                )}
              </div>
              <div className="prism-block-content">
                {deepError ? (
                  <>
                    <div className="error-icon">⚡</div>
                    <p className="prism-opinion-text font-serif first-deep-para">
                      深度解读生成失败，让 {currentPerspective.name} 再尝试一下？
                    </p>
                    <div className="retry-actions">
                      <button
                        className="retry-btn"
                        onClick={() => loadPerspectiveCommentary(currentPerspective)}
                      >
                        🔄 重新生成解读
                      </button>
                      <button
                        className="retry-btn secondary"
                        onClick={() => navigate('/')}
                      >
                        ← 换个新闻看看
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {(deepOpinion || '').split('\n\n').filter(p => p.trim()).map((para, pIdx) => (
                      <p key={pIdx} className={`prism-opinion-text font-serif ${pIdx === 0 ? 'first-deep-para' : ''}`}>
                        {pIdx === 0 && para.charAt(0) && <span className="drop-cap">{para.charAt(0)}</span>}
                        {pIdx === 0 ? para.slice(1) : para}
                      </p>
                    ))}
                    {isStreaming && !deepOpinion && (
                      <div className="streaming-thinking">
                        <div className="thinking-dots">
                          <span></span><span></span><span></span>
                        </div>
                        <p className="prism-opinion-text font-serif first-deep-para">
                          {currentPerspective.name} 正在思考中...
                          {streamRetryCount > 1 && <span className="retry-hint">（第{streamRetryCount}次尝试）</span>}
                        </p>
                      </div>
                    )}
                    {isStreaming && deepOpinion && <span className="streaming-indicator"></span>}
                    {opinionKeywords.length > 0 && !isStreaming && deepOpinion && (
                      <div className="opinion-keywords">
                        {opinionKeywords.map((kw, ki) => (
                          <span key={ki} className="keyword-tag">#{kw}</span>
                        ))}
                      </div>
                    )}
                    <div className="prism-bio">
                      <span className="bio-tag">{currentPerspective.description}</span>
                    </div>
                  </>
                )}
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
