import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getMockContentDetail, getMockRelatedContent, MOCK_ROLES, generateOpinion, getLocalImagePath } from '../mock/data'
import { useAppStore } from '../store/useAppStore'
import SharePoster from '../components/SharePoster'
import BreakthroughModal from '../components/BreakthroughModal'
import { analyzeAttitude, extractKeywords, ATTITUDE_CONFIG } from '../utils/opinionAnalyzer'
import { generateDeepOpinionByStyle } from '../utils/opinionGenerator'
import './ContentDetail.css'

const CATEGORY_EXTENSIONS = {
  tech: [
    '业内专家指出，这一技术进展并非孤立事件，而是近年来相关领域持续投入、厚积薄发的结果。从实验室突破到产业应用，通常需要经历三到五年的转化周期，而当前正处于关键的落地窗口期。多家头部企业已在该方向布局专利和产品线，预计未来一年内将有更多商业化产品面世。',
    '值得关注的是，技术迭代带来的不仅是效率提升，也伴随着就业结构、伦理边界和监管框架等方面的新挑战。有学者呼吁，在推动技术创新的同时，应当同步建立健全相关的法律法规和行业标准，确保技术发展始终沿着造福社会的方向前进，避免技术红利被少数群体独占。',
    '从国际竞争格局来看，全球主要经济体均在该领域加大研发投入，技术路线的选择和标准制定将深刻影响未来十年的产业分工。我国在部分细分领域已实现从跟跑到并跑甚至领跑的转变，但在基础研究和核心元器件方面仍存在短板，需要持续投入和长期积累。'
  ],
  social: [
    '记者在走访中了解到，这一事件在社交平台上引发了广泛讨论，相关话题阅读量迅速攀升。支持方和反对方各执一词，观点交锋激烈。有社会学专家表示，此类争议的出现本身就折射出社会价值观的多元化趋势，不同群体基于自身经历和立场形成不同判断，这在转型期社会中是正常现象。',
    '当事人在接受采访时表示，事件的发酵程度超出了预期，希望公众能够给予更多理解和空间，也希望相关部门能够依法依规处理。附近居民则向记者反映，类似的情况并非个例，背后折射出的深层次问题值得关注，包括资源分配不均、沟通渠道不畅、基层治理有待加强等方面。',
    '法律界人士指出，该事件涉及多方主体的权利义务关系，需要在法治框架内妥善解决。同时也提醒公众，在网络空间发表言论应当遵守法律法规，尊重他人合法权益，理性表达诉求，避免情绪化判断和网络暴力行为，共同维护健康的网络环境和社会秩序。'
  ],
  edu: [
    '教育界人士普遍认为，这一话题之所以引发广泛关注，根本原因在于它触及了千家万户的切身利益。从优质教育资源的分配，到升学竞争的压力，再到教育公平的实现，每一个环节都牵动着家长和学生的神经。长期以来，教育改革始终在减负与提质、公平与效率之间寻找平衡点。',
    '一线教师向记者表示，政策的初衷是好的，但在实际执行层面往往面临诸多现实困难。班级人数过多、评价体系单一、家校沟通不畅等问题，都影响着政策落地的效果。有从教二十年的资深教师坦言，真正的教育改革需要学校、家庭、社会三方合力，任何一方缺位都难以达到预期效果。',
    '不少家长在接受采访时表达了矛盾的心态：一方面希望孩子能够快乐成长、全面发展，另一方面又不得不面对升学竞争的现实压力。"内卷"现象从校外培训蔓延到校内教育，学生的课业负担虽然形式上有所减轻，但家长的焦虑感并未实质性缓解。如何走出这一困境，考验着决策者的智慧。'
  ],
  consume: [
    '消费市场研究机构的数据显示，相关品类的市场规模近年来持续扩大，消费者结构也在发生显著变化。年轻一代消费者更注重品质、体验和情感价值，品牌忠诚度相对较低，更愿意为兴趣和审美付费。这一消费趋势的变化正在倒逼传统品牌加速转型升级，也为新品牌的崛起创造了机会窗口。',
    '价格波动是近期消费者反映最集中的问题之一。记者从多个渠道了解到，受原材料成本、供应链调整和季节性因素等多重影响，部分商品和服务的价格出现了不同程度的上涨。有经济学专家分析认为，当前的价格波动属于结构性调整，总体物价水平保持基本稳定，消费者无需过度担忧。',
    '业内人士提醒消费者，面对层出不穷的营销手段和促销活动，应当保持理性消费意识，根据自身实际需求做出购买决策，避免冲动消费和过度借贷。同时建议消费者注意保留消费凭证，了解自身合法权益，在遇到消费纠纷时通过正规渠道维权，共同营造诚信、公平的消费环境。'
  ],
  culture: [
    '文化评论人表示，这一文化现象的走红并非偶然，而是传统文化与当代审美碰撞融合的产物。近年来，从故宫文创到国风音乐，从非遗新传到国潮设计，越来越多的年轻人开始重新发现和拥抱传统文化，并用他们这一代人的方式进行创造性转化和创新性发展，让古老文化焕发出新的生命力。',
    '从事文化产业多年的业内人士指出，文化消费的升级趋势十分明显。消费者不再满足于被动接受，而是渴望参与、互动和共创。沉浸式展览、互动式演出、文化主题体验等新业态蓬勃发展，既满足了人民群众日益增长的精神文化需求，也为文化产业发展注入了新动能。',
    '有学者强调，文化自信不是复古排外，而是在传承中华优秀传统文化的基础上，吸收借鉴世界优秀文明成果，创造出属于我们这个时代的新文化。传统文化的生命力在于创新，只有让收藏在博物馆里的文物、陈列在广阔大地上的遗产、书写在古籍里的文字都活起来，才能真正实现文化的繁荣兴盛。'
  ],
  health: [
    '医疗健康领域专家提醒公众，面对此类健康相关信息，应当通过权威渠道获取科学知识，切勿轻信网络传言和非正规来源的"养生秘诀"。很多流传甚广的说法缺乏循证医学依据，盲目跟风不仅可能无效，还可能延误最佳诊疗时机，对身体健康造成损害。',
    '三甲医院临床医生告诉记者，近年来公众健康意识显著提升，这是值得肯定的进步。但与此同时，健康焦虑也在一定程度上蔓延，部分人过度体检、过度医疗，反而对身心造成不必要的负担。医生建议，保持规律作息、均衡饮食、适度运动和良好心态，才是维护健康最经济有效的方式。',
    '公共卫生领域研究者指出，个人健康与公共卫生体系息息相关。从疫苗接种到慢性病管理，从心理健康到老年照护，都需要完善的制度保障和充足的医疗资源投入。推进健康中国建设，不仅要治病，更要防病；不仅要关注生理健康，也要重视心理健康，全方位全周期保障人民健康。'
  ],
  general: [
    '此事经媒体报道后，迅速引发社会各界的广泛关注和热议。多位专家学者从不同角度进行了解读分析，普遍认为该事件具有一定的典型意义和代表性，反映了当前社会发展进程中值得关注的新动向、新问题，需要理性看待、妥善应对。',
    '记者在进一步调查中发现，事件背后牵涉的因素远比表面看到的复杂。从历史沿革到现实矛盾，从个体选择到制度设计，多种因素交织叠加，使得这一话题具备了持续讨论的公共价值。相关部门已对此事给予关注，表示将在充分调研的基础上研究制定相应措施。',
    '有观察人士指出，在信息传播高度发达的今天，公众对公共事件的关注度和参与度前所未有地提高。这既是社会进步的表现，也对信息甄别能力和理性讨论素养提出了更高要求。希望各方能够在尊重事实的基础上开展建设性对话，共同推动问题的妥善解决和社会的持续进步。'
  ]
}

function extendArticleBody(title, category, summary) {
  const cat = CATEGORY_EXTENSIONS[category] || CATEGORY_EXTENSIONS.general
  const base = summary || ''
  const pars = [base]
  const shuffled = [...cat].sort(() => Math.random() - 0.5)
  pars.push(shuffled[0])
  pars.push(shuffled[1])
  return pars
}

function getOtherPerspectives(currentPerspName, count = 4) {
  return MOCK_ROLES.filter(r => r.name !== currentPerspName).sort(() => Math.random() - 0.5).slice(0, count)
}

function ContentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedPerspectives, incrementReadCount, resetSelection } = useAppStore()
  const [content, setContent] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSharePoster, setShowSharePoster] = useState(false)
  const [showBreakthrough, setShowBreakthrough] = useState(false)
  const [breakthroughData, setBreakthroughData] = useState(null)
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
    return perspectiveOpinion ? analyzeAttitude(perspectiveOpinion) : null
  }, [perspectiveOpinion])

  const opinionKeywords = useMemo(() => {
    return perspectiveOpinion ? extractKeywords(perspectiveOpinion, 5) : []
  }, [perspectiveOpinion])

  useEffect(() => {
    loadContent()
    countedRef.current = false
    setActivePerspective(null)
    setMainImgError(false)
    setRelatedImgErrors({})
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

  useEffect(() => {
    if (!loading) {
      window.scrollTo(0, 0)
    }
  }, [loading])

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

    const mockData = getMockContentDetail(id, defaultPerspective)
    if (mockData) {
      const summary = mockData.summary || ''
      const bodyParagraphs = summary.length < 100
        ? extendArticleBody(mockData.title, mockData.category, summary)
        : [summary]
      mockData.content = bodyParagraphs.join('\n\n')
      mockData._bodyParagraphs = bodyParagraphs
      setContent(mockData)
      const relatedItems = getMockRelatedContent(id, null, 3)
      setRelated(relatedItems)
      setOtherPersps(getOtherPerspectives(defaultPerspective?.name, 4))
      computePrevNext(relatedItems)
    }
    setLoading(false)
  }

  const computePrevNext = (relatedItems) => {
    if (relatedItems && relatedItems.length >= 2) {
      setPrevNext({ prev: relatedItems[0], next: relatedItems[1] })
    } else if (relatedItems && relatedItems.length === 1) {
      setPrevNext({ prev: relatedItems[0], next: null })
    } else {
      setPrevNext({ prev: null, next: null })
    }
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
    setTimeout(() => {
      const el = document.querySelector('.prism-perspective-block')
      if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' })
    }, 50)
  }

  const handleResetPerspective = () => {
    setActivePerspective(null)
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

  const handleAvatarError = (key) => {
    setAvatarErrors(prev => ({ ...prev, [key]: true }))
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
                {currentPerspective.local_image && !avatarErrors[`main_${currentPerspective.name}`] ? (
                  <img 
                    src={getLocalImagePath(currentPerspective.local_image)} 
                    alt={currentPerspective.name}
                    className="prism-avatar"
                    onError={() => handleAvatarError(`main_${currentPerspective.name}`)}
                  />
                ) : (
                  <span className="prism-avatar-emoji">{currentPerspective.emoji}</span>
                )}
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
                        {p.local_image && !avatarErrors[avatarKey] ? (
                          <img 
                            src={getLocalImagePath(p.local_image)} 
                            alt={p.name}
                            className="other-persp-avatar"
                            onError={() => handleAvatarError(avatarKey)}
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
