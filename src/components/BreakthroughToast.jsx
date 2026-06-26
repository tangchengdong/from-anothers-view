import React, { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import './BreakthroughToast.css'

const ACHIEVEMENTS = [
  { threshold: 3, title: '初窥门径', desc: '你刚刚推开了第一扇窗', emoji: '🔓' },
  { threshold: 5, title: '破茧新生', desc: '茧房裂开第一道缝', emoji: '🦋' },
  { threshold: 8, title: '视角转换', desc: '原来世界这么不一样', emoji: '👁' },
  { threshold: 12, title: '棱镜探索者', desc: '你已经看到了棱镜的多面', emoji: '◈' },
  { threshold: 16, title: '思想破壁者', desc: '算法已无法框住你的视野', emoji: '⚡' },
  { threshold: 20, title: '自由之眼', desc: '恭喜，你真正破茧而出', emoji: '✦' }
]

function BreakthroughToast({ readCount, perspectives }) {
  const { pendingBreakthrough, clearPendingBreakthrough } = useAppStore()
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  const currentAchievement = ACHIEVEMENTS.find(a => a.threshold === readCount) || 
    ACHIEVEMENTS[Math.min(Math.floor(readCount / 3), ACHIEVEMENTS.length - 1)]

  useEffect(() => {
    if (!pendingBreakthrough) return

    setVisible(true)
    setClosing(false)

    const timer = setTimeout(() => {
      setClosing(true)
      setTimeout(() => {
        setVisible(false)
        clearPendingBreakthrough?.()
      }, 500)
    }, 3000)

    return () => clearTimeout(timer)
  }, [pendingBreakthrough, clearPendingBreakthrough])

  if (!visible || !currentAchievement) return null

  return (
    <div className={`breakthrough-toast ${closing ? 'closing' : ''}`}>
      <div className="toast-content">
        <span className="toast-emoji">{currentAchievement.emoji}</span>
        <div className="toast-text">
          <div className="toast-title">成就解锁！</div>
          <div className="toast-achievement">{currentAchievement.title}</div>
        </div>
      </div>
    </div>
  )
}

export default BreakthroughToast
