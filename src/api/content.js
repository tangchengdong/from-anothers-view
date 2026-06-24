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
