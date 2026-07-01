import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ContentItem from './ContentItem'
import './StreamFeed.css'
import './Skeleton.css'
import { getFeed } from '../api/content'

const CATEGORY_LABELS = {
  social: '社会',
  tech: '科技',
  edu: '教育',
  consume: '消费',
  culture: '文化',
  general: '综合'
}

function generateRecommendationReason(perspective, count) {
  if (!perspective) return null
  const name = perspective.name
  const interests = (perspective.interested_categories || []).map(c => CATEGORY_LABELS[c] || c).slice(0, 3)
  const keywords = (perspective.keywords || []).slice(0, 3)

  const reasons = [
    `作为「${name}」，为你精选了 ${count} 条符合身份视角的资讯`,
    `基于「${name}」的兴趣偏好（${interests.join('、')}），为你个性化推荐`,
    `换了「${name}」的视角，看到的世界果然不一样——为你筛选了 ${count} 条相关资讯`,
    `「${name}」关注的关键词：${keywords.join('、')}——为你匹配了这些资讯`,
  ]

  return reasons[Math.floor(Math.random() * reasons.length)]
}

function StreamFeed({ perspective, subcategory, limit = 20, sectionTitle }) {
  const [items, setItems] = useState([])
  const [thinking, setThinking] = useState([])
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(limit > 10)
  const [page, setPage] = useState(0)
  
  const esRef = useRef(null)
  const observer = useRef(null)
  const sentinelRef = useRef(null)
  const itemsRef = useRef([])
  const pageRef = useRef(0)
  const requestIdRef = useRef(0)
  const loadMoreIdRef = useRef(0)
  
  useEffect(() => {
    itemsRef.current = items
    pageRef.current = page
  }, [items, page])
  
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || !done || limit <= 10) return
    
    const observerOptions = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1,
    }
    
    const handleIntersect = (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && !loadingMore && hasMore) {
        loadMore()
      }
    }
    
    observer.current = new IntersectionObserver(handleIntersect, observerOptions)
    observer.current.observe(sentinelRef.current)
    
    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [loadingMore, hasMore, done, limit])

  const loadInitialData = useCallback(async () => {
    const myRequestId = ++requestIdRef.current
    
    setItems([])
    setThinking([])
    setProgress({ current: 0, total: limit })
    setDone(false)
    setError(false)
    setPage(0)
    setHasMore(limit > 10)

    if (!perspective) {
      setDone(true)
      return
    }

    try {
      const perspectiveName = perspective.name || perspective
      const thinkingMessages = limit <= 10 ? [
        `正在切换到「${perspectiveName}」视角...`,
        '正在为你筛选精选资讯...',
      ] : [
        `正在切换到「${perspectiveName}」视角...`,
        '正在分析该角色的兴趣偏好...',
        '正在筛选相关资讯...',
        '正在为你整理多元视角内容...',
      ]

      for (let i = 0; i < thinkingMessages.length; i++) {
        if (requestIdRef.current !== myRequestId) return
        await new Promise(resolve => setTimeout(resolve, 250))
        if (requestIdRef.current !== myRequestId) return
        setThinking((prev) => [...prev, thinkingMessages[i]])
      }

      await new Promise(resolve => setTimeout(resolve, 300))
      if (requestIdRef.current !== myRequestId) return

      // 从后端 API 获取实时新闻数据
      const perspectiveNameStr = perspective.name || perspective
      const resp = await getFeed(perspectiveNameStr, limit)
      const apiItems = resp?.items || []

      if (requestIdRef.current !== myRequestId) return

      // 逐条展示（保留流式加载动效）
      const collectedItems = []
      for (let i = 0; i < apiItems.length; i++) {
        if (requestIdRef.current !== myRequestId) return
        await new Promise(resolve => setTimeout(resolve, limit <= 10 ? 60 : 80))
        if (requestIdRef.current !== myRequestId) return
        collectedItems.push(apiItems[i])
        setItems([...collectedItems])
        setProgress((prev) => ({
          current: i + 1,
          total: limit,
        }))
      }

      if (requestIdRef.current !== myRequestId) return
      setThinking([])
      setDone(true)
    } catch (err) {
      console.error('加载失败:', err)
      if (requestIdRef.current === myRequestId) {
        setError(true)
        setThinking([])
        setDone(true)
      }
    }
  }, [perspective, subcategory, limit])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !done || itemsRef.current.length === 0 || limit <= 10) return
    
    const myLoadId = ++loadMoreIdRef.current
    setLoadingMore(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      if (loadMoreIdRef.current !== myLoadId) return
      
      // 从 API 加载更多（用更大的 limit，取已有之后的部分）
      const perspectiveNameStr = perspective?.name || perspective
      if (!perspectiveNameStr) return
      const moreLimit = itemsRef.current.length + 10
      const resp = await getFeed(perspectiveNameStr, moreLimit)
      const allItems = resp?.items || []
      const moreItems = allItems.slice(itemsRef.current.length)
      
      if (loadMoreIdRef.current !== myLoadId) return
      if (moreItems.length > 0) {
        setItems((prev) => [...prev, ...moreItems])
        setPage((prev) => prev + 1)
      }
      
      if (allItems.length <= itemsRef.current.length + moreItems.length || moreItems.length === 0) {
        setHasMore(false)
      }
      
    } catch (err) {
      console.error('加载更多失败:', err)
    } finally {
      if (loadMoreIdRef.current === myLoadId) {
        setLoadingMore(false)
      }
    }
  }, [loadingMore, hasMore, done, limit, perspective])

  useEffect(() => {
    loadInitialData()
    return () => {
      requestIdRef.current++
      loadMoreIdRef.current++
      if (esRef.current) {
        esRef.current.close()
      }
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [loadInitialData])

  const recommendationReason = useMemo(() => {
    if (!perspective || !done || items.length === 0) return null
    return generateRecommendationReason(perspective, items.length)
  }, [perspective, done, items.length])

  return (
    <section className="stream-feed-section">
      {sectionTitle && (
        <h3 className="feed-section-title">{sectionTitle}</h3>
      )}

      {recommendationReason && (
        <div className="recommendation-reason-banner">
          <span className="reason-icon">◈</span>
          <span className="reason-text">{recommendationReason}</span>
        </div>
      )}

      {thinking.length > 0 && !done && (
        <div className="thinking-area">
          {thinking.map((msg, i) => (
            <div key={i} className="thinking-step">
              <span className="thinking-dot"></span>
              {msg}
            </div>
          ))}
        </div>
      )}

      {!done && items.length >= 0 && (
        <div className="progress-bar">
          <div className="progress-text">
            {error ? '⚠️ 加载失败，请刷新重试' : `🦋 正在为你推送资讯... ${items.length}/${progress.total || limit}`}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min((items.length / (progress.total || limit)) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {items.length > 0 ? (
        <div className="stream-items-grid">
          {items.map((item, index) => (
            <ContentItem key={item.id || index} content={item} index={index} perspective={perspective} />
          ))}
        </div>
      ) : (
        !done && !error && (
          <div className="skeleton-grid">
            {[0, 1, 2, 3, 4, 5].slice(0, limit).map((i) => (
              <div key={i} className="skeleton-card skeleton-card-wrap" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="skeleton-card-image"></div>
                <div className="skeleton-line long"></div>
                <div className="skeleton-line medium"></div>
                <div className="skeleton-line short"></div>
              </div>
            ))}
          </div>
        )
      )}

      {hasMore && done && items.length > 0 && limit > 10 && (
        <div className="load-more-container">
          {loadingMore && (
            <div className="load-more-skeleton">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton-card skeleton-card-wrap">
                  <div className="skeleton-card-image"></div>
                  <div className="skeleton-line long"></div>
                  <div className="skeleton-line medium"></div>
                </div>
              ))}
            </div>
          )}
          {!loadingMore && (
            <div className="load-more-hint" ref={sentinelRef}>
              继续向下滚动加载更多
            </div>
          )}
        </div>
      )}

      {!perspective && done && items.length === 0 && !error && (
        <div className="stream-empty">
          <div className="empty-icon">👁️</div>
          <p>请先选择一个视角，开始你的破茧之旅</p>
        </div>
      )}

      {error && done && (
        <div className="stream-error">
          <div className="error-icon">⚠️</div>
          <p className="error-text">加载失败，请检查网络后重试</p>
          <button className="error-retry-btn" onClick={loadInitialData}>
            🔄 重新加载
          </button>
        </div>
      )}

      {(!hasMore || limit <= 10) && done && items.length > 0 && (
        <div className="stream-done">
          <span className="done-icon">✨</span>
          已为你呈现 {items.length} 条精选资讯
        </div>
      )}
    </section>
  )
}

export default StreamFeed
