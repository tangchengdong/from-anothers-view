import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { searchContent, suggestPerspectives, getCommentary } from '../api/content'
import { RARITY_CONFIG } from '../mock/data'
import { useAppStore } from '../store/useAppStore'
import SearchBox from '../components/SearchBox'
import ContentItem from '../components/ContentItem'
import '../components/Skeleton.css'
import './SearchResults.css'

function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const navigate = useNavigate()
  const { selectedPerspectives } = useAppStore()
  const [results, setResults] = useState([])
  const [commentaries, setCommentaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activePerspective, setActivePerspective] = useState('all')
  const [customPerspectives, setCustomPerspectives] = useState([])
  const [customInput, setCustomInput] = useState('')

  const currentPerspective = selectedPerspectives?.length === 1 ? selectedPerspectives[0] : (selectedPerspectives?.[0] || null)

  useEffect(() => {
    if (query) {
      doSearch()
    } else {
      setLoading(false)
    }
  }, [query])

  const doSearch = async (customList = customPerspectives) => {
    setLoading(true)
    setError(null)
    try {
      let perspective = currentPerspective

      const searchResult = await searchContent(query, perspective, 20)
      const searchResults = Array.isArray(searchResult)
        ? searchResult
        : (searchResult?.results || [])
      setResults(searchResults)

      // 没有 news_id 时跳过视角评论生成，仅展示搜索结果
      const newsId = searchResults[0]?.id
      if (!newsId) {
        setCommentaries([])
        return
      }

      const rolesResp = await suggestPerspectives(Math.min(4 + customList.length, 8))
      const roles = Array.isArray(rolesResp) ? rolesResp : (rolesResp?.results || [])

      const generatedCommentaries = await Promise.all(
        roles.map(async (role) => {
          const rarityCfg = RARITY_CONFIG[role.base_rarity || 'n']
          let viewpoint = ''
          try {
            const res = await getCommentary(newsId, role.name)
            viewpoint = res?.commentary || ''
          } catch (e) {
            console.error(`生成 ${role.name} 评论失败`, e)
          }
          return {
            perspective_id: role.name,
            role_name: role.name,
            emoji: role.emoji,
            color: rarityCfg?.color || role.color || '#888',
            headline: `${role.name}怎么看「${query}」`,
            viewpoint,
            tags: role.keywords?.slice(0, 3) || [],
            is_custom: false
          }
        })
      )

      const customCommentaries = await Promise.all(
        customList.map(async (name) => {
          let viewpoint = ''
          try {
            const res = await getCommentary(newsId, name)
            viewpoint = res?.commentary || ''
          } catch (e) {
            console.error(`生成 ${name} 评论失败`, e)
          }
          return {
            perspective_id: name,
            role_name: name,
            emoji: '🎭',
            color: '#B8860B',
            headline: `${name}怎么看「${query}」`,
            viewpoint,
            tags: ['自定义视角'],
            is_custom: true
          }
        })
      )

      setCommentaries([...generatedCommentaries, ...customCommentaries])
    } catch (err) {
      console.error('搜索失败', err)
      setError('搜索失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    doSearch()
  }

  const handleAddCustom = (name) => {
    const trimmed = name.trim()
    if (!trimmed || customPerspectives.includes(trimmed)) return
    const newList = [...customPerspectives, trimmed]
    setCustomPerspectives(newList)
    setCustomInput('')
    doSearch(newList)
  }

  const handleRemoveCustom = (name) => {
    const newList = customPerspectives.filter(p => p !== name)
    setCustomPerspectives(newList)
    doSearch(newList)
  }

  const handleCustomKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCustom(customInput)
    }
  }

  const filteredResults = activePerspective === 'all'
    ? results
    : results.filter(r => (r.perspective_name || r.perspective_id) === activePerspective)

  const perspectiveGroups = {}
  results.forEach(item => {
    const pname = item.perspective_name || item.is_real ? '真实新闻' : '棱镜推荐'
    const groupName = item.is_real ? '📰 真实资讯' : '✨ 模拟资讯'
    if (!perspectiveGroups[groupName]) perspectiveGroups[groupName] = []
    perspectiveGroups[groupName].push(item)
  })

  return (
    <div className="search-page">
      <div className="search-container">
        <div className="search-header">
          <button className="back-btn" onClick={() => navigate(-1)}>← 返回</button>
          <h1 className="search-title font-serif">
            搜索结果
          </h1>
        </div>

        <SearchBox />

        {query && !loading && !error && (
          <div className="search-query-display">
            <p className="search-count">
              找到 <span className="search-query">{results.length}</span> 条与「<span className="search-query-highlight">{query}</span>」相关的资讯
            </p>
          </div>
        )}

        {error && (
          <div className="search-error">
            <div className="error-icon">⚠️</div>
            <p className="error-text">{error}</p>
            <button className="retry-btn" onClick={handleRetry}>重新搜索</button>
          </div>
        )}

        {!error && query && !loading && commentaries.length > 0 && (
          <section className="commentary-section">
            <div className="commentary-header">
              <h2 className="commentary-title font-serif">
                {commentaries.length}重视角解读「{query}」
              </h2>
              <p className="commentary-subtitle">
                不同身份的角色对此话题的观点
                {customPerspectives.length > 0 && `（含 ${customPerspectives.length} 个自定义视角）`}
              </p>
            </div>
            <div className="commentary-grid">
              {commentaries.map((c, i) => (
                <div
                  className={`commentary-card ${c.is_custom ? 'commentary-card-custom' : ''}`}
                  key={c.perspective_id}
                  style={{
                    animationDelay: `${i * 0.08}s`,
                    borderColor: `${c.color}33`,
                  }}
                >
                  {c.is_custom && <span className="custom-badge">自定义</span>}
                  <div className="commentary-card-header">
                    <span className="commentary-emoji">{c.emoji}</span>
                    <span className="commentary-role" style={{ color: c.color }}>
                      {c.role_name}
                    </span>
                  </div>
                  <h3 className="commentary-headline">{c.headline}</h3>
                  <p className="commentary-viewpoint">{c.viewpoint}</p>
                  <div className="commentary-tags">
                    {c.tags?.map((tag, ti) => (
                      <span className="commentary-tag" key={ti}>#{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!error && query && !loading && results.length > 0 && (
          <div className="perspective-tabs">
            <button
              className={`tab-btn ${activePerspective === 'all' ? 'active' : ''}`}
              onClick={() => setActivePerspective('all')}
            >
              全部 ({results.length})
            </button>
            {Object.keys(perspectiveGroups).map(pname => (
              <button
                key={pname}
                className={`tab-btn ${activePerspective === pname ? 'active' : ''}`}
                onClick={() => setActivePerspective(pname)}
              >
                {pname} ({perspectiveGroups[pname].length})
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="skeleton-search-grid">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div className="skeleton-card skeleton-card-wrap" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="skeleton-card-image"></div>
                <div className="skeleton-line long"></div>
                <div className="skeleton-line medium"></div>
                <div className="skeleton-line short"></div>
              </div>
            ))}
          </div>
        ) : error ? null : !query ? (
          <div className="search-empty">
            <div className="empty-icon">🔍</div>
            <p className="empty-text">请输入关键词开始搜索</p>
            <p className="empty-hint">在上方搜索框输入你感兴趣的话题</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="search-empty">
            <div className="empty-icon">📭</div>
            <p className="empty-text">未找到与「{query}」相关的资讯</p>
            <p className="empty-hint">换个关键词试试？</p>
          </div>
        ) : (
          <div className="search-results-grid">
            {filteredResults.map((item, index) => (
              <ContentItem key={item.id} content={item} index={index} perspective={currentPerspective} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchResults
