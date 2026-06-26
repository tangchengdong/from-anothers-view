import React, { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getLocalImagePath, getCardImagePath } from '../mock/data'
import './BreakthroughModal.css'

const ACHIEVEMENTS = [
  { threshold: 3, title: '初窥门径', desc: '你刚刚推开了第一扇窗', emoji: '🔓' },
  { threshold: 5, title: '破茧新生', desc: '茧房裂开第一道缝', emoji: '🦋' },
  { threshold: 8, title: '视角转换', desc: '原来世界这么不一样', emoji: '👁' },
  { threshold: 12, title: '棱镜探索者', desc: '你已经看到了棱镜的多面', emoji: '◈' },
  { threshold: 16, title: '思想破壁者', desc: '算法已无法框住你的视野', emoji: '⚡' },
  { threshold: 20, title: '自由之眼', desc: '恭喜，你真正破茧而出', emoji: '✦' }
]

const QUOTES = [
  '看见不同，才能理解不同',
  '每一个视角都是一面镜子',
  '真相不在单面，而在棱镜之中',
  '跳出茧房，世界如此辽阔',
  '你看到的，只是算法想让你看到的'
]

function BreakthroughModal({ readCount, perspectives, onClose }) {
  const { pendingBreakthrough, clearPendingBreakthrough } = useAppStore()
  const [closing, setClosing] = useState(false)
  const [entered, setEntered] = useState(false)
  const [avatarError, setAvatarError] = useState({})

  const currentAchievement = ACHIEVEMENTS.find(a => a.threshold === readCount) || 
    ACHIEVEMENTS[Math.min(Math.floor(readCount / 3), ACHIEVEMENTS.length - 1)]
  
  const nextAchievement = ACHIEVEMENTS.find(a => a.threshold > readCount)
  const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)]
  const currentPersp = perspectives?.[0]

  const getAvatarUrl = (p) => {
    const cardKey = `card_${p.local_image}`
    const localKey = `local_${p.local_image}`
    
    if (p.card_image && !avatarError[cardKey]) {
      return { url: getCardImagePath(p.card_image), isCard: true, key: cardKey }
    }
    if (p.local_image && !avatarError[localKey]) {
      return { url: getLocalImagePath(p.local_image), isCard: false, key: localKey }
    }
    return null
  }

  const handleAvatarError = (key) => {
    setAvatarError(prev => ({ ...prev, [key]: true }))
  }

  const renderAvatar = (p) => {
    const avatar = getAvatarUrl(p)
    if (avatar) {
      return (
        <img 
          src={avatar.url} 
          alt={p.name}
          className="achievement-persp-avatar"
          onError={() => handleAvatarError(avatar.key)}
        />
      )
    }
    return null
  }

  useEffect(() => {
    setTimeout(() => setEntered(true), 100)
  }, [])

  const handleContinue = () => {
    setClosing(true)
    setTimeout(() => {
      clearPendingBreakthrough?.()
      onClose?.()
    }, 400)
  }

  if (!currentAchievement) return null

  return (
    <div className={`breakthrough-overlay ${closing ? 'closing' : ''}`}>
      <div className={`breakthrough-modal ${entered ? 'entered' : ''}`}>
        <div className="breakthrough-decoration" />

        <div className="achievement-badge">
          <span className="badge-dot" />
          破茧成就
        </div>

        <div className="achievement-icon-area">
          <div className="achievement-icon-glow">
            <span className="achievement-emoji">{currentAchievement.emoji}</span>
          </div>
        </div>

        <h2 className="achievement-title">{currentAchievement.title}</h2>
        <p className="achievement-desc">「{currentAchievement.desc}」</p>

        <div className="achievement-stats">
          <div className="stat-item">
            <span className="stat-number">{readCount}</span>
            <span className="stat-label">篇资讯阅读</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">{perspectives?.length || 1}</span>
            <span className="stat-label">个视角体验</span>
          </div>
        </div>

        {nextAchievement && (
          <p className="next-hint">
            再阅读 <strong>{nextAchievement.threshold - readCount}</strong> 篇，解锁「{nextAchievement.title}」
          </p>
        )}

        {currentPersp && (
          <div className="achievement-perspective">
            {renderAvatar(currentPersp)}
            <span className="achievement-persp-text">
              当前视角：{currentPersp.name}
            </span>
          </div>
        )}

        <div className="breakthrough-quote">
          <p>"{randomQuote}"</p>
          <span className="quote-author">— 棱镜日报</span>
        </div>

        <button className="continue-btn" onClick={handleContinue}>
          <span>继续探索 →</span>
        </button>
      </div>
    </div>
  )
}

export default BreakthroughModal
