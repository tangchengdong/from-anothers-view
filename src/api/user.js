import request from './request'

export function getPreferences() {
  return request.get('/user/preferences')
}

export function updatePreferences(data) {
  return request.put('/user/preferences', data)
}

export function getProfile() {
  return request.get('/user/profile')
}

export function updateProfile(data) {
  return request.put('/user/profile', data)
}

export function getCircles() {
  return request.get('/user/circles')
}

export function getFavorites() {
  return request.get('/user/favorites')
}

export function toggleFavorite(contentId) {
  return request.post(`/user/favorites/${contentId}`)
}

export function toggleLike(contentId) {
  return request.post(`/user/likes/${contentId}`)
}

export function getInteractionStatus(contentId) {
  return request.get(`/user/interactions/${contentId}`)
}
