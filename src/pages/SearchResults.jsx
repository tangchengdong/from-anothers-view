import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { searchContent } from '../api/content'
import ContentItem from '../components/ContentItem'
import '../components/Skeleton.css'
import './SearchResults.css'

const SUGGESTED_PERSPECTIVES = [
  '投资者', '学生', '医生', '律师', '教师',
  '企业家', '设计师', '心理学家', '历史学者', '环保人士',
]

function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [commentaries, setCommentaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePerspective, setActivePerspective] = useState('all')
  const [isSimulated, setIsSimulated] = useState(false)
  const [customPerspectives, setCustomPerspectives] = useState([])
  const [customInput, setCustomInput] = useState('')

  useEffect(() => {
    if (query) {
      doSearch()
    }
  }, [query])

  const doSearch = async (customList = customPerspectives) => {
    setLoading(true)
    try {
      const res = await searchContent(query, null, 20, customList.length > 0 ? customList : null)
      setResults(res.results || [])
      setCommentaries(res.commentaries || [])
      setIsSimulated(res.is_simulated || false)
    } catch (err) {
      console.error('搜索失败', err)
    } finally {
      setLoading(false)
    }
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
    const pname = item.perspective_name || item.perspective_id || 'other'
    if (!perspectiveGroups[pname]) perspectiveGroups[pname] = []
    perspectiveGroups[pname].push(item)
  })

  return (
    <div className="search-page">
      <div className="search-container">
        <div className="search-header">
          <button className="back-btn" onClick={() => navigate(-1)}>← 返回</button>
          <h1 className="search-title">
            搜索结果：<span className="search-query">"{query}"</span>
          </h1>
          <p className="search-count">
            共找到 {results.length} 条相关内容
            {isSimulated && <span className="simulated-badge"> · 模拟资讯</span>}
          </p>
        </div>

        {/* 自定义视角输入区 */}
        <div className="custom-perspective-bar">
          <div className="custom-perspective-label">
            <span className="cp-icon">🎯</span>
            <span>添加自定义视角</span>
          </div>
          <div className="custom-perspective-input-wrap">
            <input
              type="text"
              className="custom-perspective-input"
              placeholder="输入视角名称，如：投资者、学生、医生..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleCustomKeyDown}
            />
            <button
              className="cp-add-btn"
              onClick={() => handleAddCustom(customInput)}
              disabled={!customInput.trim()}
            >
              + 添加视角
            </button>
          </div>
          <div className="custom-perspective-tags">
            {customPerspectives.map(name => (
              <span key={name} className="cp-tag-active">
                {name}
                <button className="cp-remove" onClick={() => handleRemoveCustom(name)}>×</button>
              </span>
            ))}
          </div>
          {customPerspectives.length === 0 && (
            <div className="cp-suggestions">
              <span className="cp-suggest-label">快捷添加：</span>
              {SUGGESTED_PERSPECTIVES.slice(0, 6).map(name => (
                <button
                  key={name}
                  className="cp-suggest-btn"
                  onClick={() => handleAddCustom(name)}
                >
                  + {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Agent 视角观点板块 */}
        {!loading && commentaries.length > 0 && (
          <section className="commentary-section">
            <div className="commentary-header">
              <h2 className="commentary-title">
                {commentaries.length}重视角解读「{query}」
              </h2>
              <p className="commentary-subtitle">
                不同圈层的 Agent 对此话题的观点
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
                      <span className="commentary-tag" key={ti}>{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 视角筛选 tabs */}
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

        {/* 搜索结果 */}
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
        ) : filteredResults.length === 0 ? (
          <div className="search-empty">
            <div className="empty-icon">🔍</div>
            <p className="empty-text">没有找到相关内容</p>
            <p className="empty-hint">换个关键词试试？</p>
          </div>
        ) : (
          <div className="search-results-grid">
            {filteredResults.map((item, index) => (
              <ContentItem key={item.id} content={item} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchResults
