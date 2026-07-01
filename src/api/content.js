import request from './request'

export function drawPerspective() {
  return request.get('/perspectives/draw')
}

export function suggestPerspectives(count = 12) {
  return request.get('/perspectives/suggest', { params: { count } })
}

export function getFeed(perspective, limit = 8, category = null) {
  const params = { perspective, limit }
  if (category) params.category = category
  return request.get('/feed', { params })
}

export function getContentDetail(id) {
  return request.get(`/content/${id}`)
}

export function searchContent(q, perspective = null, limit = 20, customPerspectives = null) {
  const params = { q, limit }
  if (perspective) params.perspective = perspective
  if (customPerspectives && customPerspectives.length > 0) {
    params.custom_perspectives = customPerspectives.join(',')
  }
  return request.get('/content/search', { params })
}

export function getRelatedContent(id, perspective = null, limit = 3) {
  const params = { limit }
  if (perspective) params.perspective = perspective
  return request.get(`/content/related/${id}`, { params })
}

// ========== 热点新闻 ==========

export function getHotNews(limit = 8) {
  return request.get('/feed/hot', { params: { limit } })
}

// ========== 视角评论（LLM 生成） ==========

export function getCommentary(newsId, perspective) {
  return request.get('/commentary/generate', { params: { news_id: newsId, perspective } })
}

export function getDeepCommentary(newsId, perspective) {
  return request.get('/commentary/deep', { params: { news_id: newsId, perspective } })
}

export function getBatchCommentary(newsId, perspectives) {
  return request.post('/commentary/batch', { news_id: newsId, perspectives })
}

export function getCommentaryStatus() {
  return request.get('/commentary/status')
}

/**
 * 流式评论（SSE）
 * @param {number} newsId
 * @param {string} perspective
 * @param {object} callbacks - { onThinking, onChunk, onDone, onError }
 */
export function streamCommentary(newsId, perspective, callbacks = {}, mode = 'short') {
  const url = `http://localhost:8000/api/commentary/stream?news_id=${newsId}&perspective=${encodeURIComponent(perspective)}&mode=${mode}`
  const eventSource = new EventSource(url)

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'thinking' && callbacks.onThinking) {
        callbacks.onThinking(data.role)
      } else if (data.type === 'chunk' && callbacks.onChunk) {
        callbacks.onChunk(data.content)
      } else if (data.type === 'done' && callbacks.onDone) {
        callbacks.onDone(data.content)
        eventSource.close()
      }
    } catch (e) {
      if (callbacks.onError) callbacks.onError(e)
      eventSource.close()
    }
  }

  eventSource.onerror = (err) => {
    if (callbacks.onError) callbacks.onError(err)
    eventSource.close()
  }

  return eventSource
}
