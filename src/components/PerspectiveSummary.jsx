import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getLocalImagePath } from '../mock/data'
import './PerspectiveSummary.css'

function PerspectiveSummary({ perspective, perspectiveData, compact = false }) {
  const { selectedPerspectiveData } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [description, setDescription] = useState('')
  const [avatarError, setAvatarError] = useState(false)

  const data = perspectiveData || selectedPerspectiveData || perspective
  const name = data?.name || perspective?.name || perspective || '当前视角'
  const emoji = data?.emoji || perspective?.emoji || '🔍'
  const rarity = data?.rarity || perspective?.rarity
  const rarityName = data?.rarity_name || perspective?.rarity_name
  const rarityLabel = data?.rarity_label || perspective?.rarity_label
  const keywords = data?.keywords || perspective?.keywords || []

  useEffect(() => {
    if (!perspective) {
      setLoading(false)
      return
    }

    setLoading(true)
    setAvatarError(false)
    setTimeout(() => {
      const builtInDesc = data?.description || perspective?.description
      setDescription(builtInDesc || `以「${name}」的视角看世界，发现不一样的精彩`)
      setLoading(false)
    }, 300)
  }, [perspective])

  if (!perspective) return null

  const getRarityLabel = () => {
    if (rarityLabel) return rarityLabel
    switch(rarity) {
      case 'ur': return '传说'
      case 'ssr': return '史诗'
      case 'sr': return '稀有'
      case 'r': return '高级'
      default: return '普通'
    }
  }

  return (
    <section className={`summary-section ${compact ? 'compact' : ''}`}>
      <div className="summary-container guide-style">
        <div className="guide-header">
          <div className="guide-role">
            {data?.local_image && !avatarError ? (
              <img 
                src={getLocalImagePath(data.local_image)} 
                alt={name}
                className="guide-avatar"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="guide-emoji">{emoji}</div>
            )}
            <div className="guide-info">
              <div className="guide-title-row">
                <h3 className="guide-title">{name}</h3>
                {rarityLabel && (
                  <span className="guide-rarity">
                    {getRarityLabel()}
                  </span>
                )}
              </div>
              {rarityName && (
                <p className="guide-rarity-name">{rarityName}</p>
              )}
            </div>
          </div>
        </div>
        <div className="guide-content">
          {loading ? (
            <div className="guide-loading">视角整理中...</div>
          ) : (
            <>
              <p className="guide-description">{description}</p>
              {keywords.length > 0 && (
                <div className="guide-tags">
                  {keywords.slice(0, 6).map((keyword, index) => (
                    <span key={index} className="guide-tag">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default PerspectiveSummary
