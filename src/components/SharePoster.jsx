import React, { useState, useRef, useEffect, useCallback } from 'react'
import { getLocalImagePath, getCardImagePath } from '../mock/data'
import './SharePoster.css'

const RARITY_LABELS = {
  ur: '传说',
  ssr: '史诗',
  sr: '稀有',
  r: '高级',
  n: '普通'
}

const RARITY_COLORS = {
  ur: '#FFD700',
  ssr: '#FF00FF',
  sr: '#00FF88',
  r: '#00FFFF',
  n: '#8888AA'
}

function SharePoster({ perspective, opinion, newsTitle, onClose }) {
  const canvasRef = useRef(null)
  const [generated, setGenerated] = useState(false)
  const [dataUrl, setDataUrl] = useState(null)

  const getCurrentDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekday = weekdays[now.getDay()]
    const startDate = new Date('2024-01-01')
    const issueNum = Math.floor((now - startDate) / (1000 * 60 * 60 * 24)) + 1
    return { dateStr: `${year}.${month}.${day} ${weekday}`, issueNum: `第 ${issueNum} 期` }
  }

  const truncateText = (text, maxLen) => {
    if (!text) return ''
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen) + '...'
  }

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const generatePoster = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 750
    const H = 1000
    canvas.width = W
    canvas.height = H

    const bgColor = '#0a0a0f'
    const accentColor = perspective?.color || '#00ffff'
    const rarity = perspective?.rarity || 'n'
    const rarityColor = RARITY_COLORS[rarity] || '#8888AA'
    const rarityLabel = RARITY_LABELS[rarity] || '普通'
    const { dateStr, issueNum } = getCurrentDate()

    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, W, H)

    const gradBg1 = ctx.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.35, 500)
    gradBg1.addColorStop(0, 'rgba(0, 255, 255, 0.08)')
    gradBg1.addColorStop(0.5, 'rgba(255, 0, 255, 0.05)')
    gradBg1.addColorStop(1, 'transparent')
    ctx.fillStyle = gradBg1
    ctx.fillRect(0, 0, W, H)

    const gradVignette = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 600)
    gradVignette.addColorStop(0, 'transparent')
    gradVignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)')
    ctx.fillStyle = gradVignette
    ctx.fillRect(0, 0, W, H)

    ctx.save()
    ctx.strokeStyle = rarity === 'ur' ? '#FFD700' : (rarity === 'ssr' ? '#FF00FF' : '#00ffff')
    ctx.lineWidth = 2
    ctx.shadowColor = hexToRgba(ctx.strokeStyle, 0.6)
    ctx.shadowBlur = 15
    ctx.strokeRect(25, 25, W - 50, H - 50)
    ctx.restore()

    ctx.strokeStyle = hexToRgba('#e8e8ff', 0.1)
    ctx.lineWidth = 1
    ctx.strokeRect(35, 35, W - 70, H - 70)

    const cornerSize = 20
    const corners = [
      [35, 35], [W - 35, 35], [35, H - 35], [W - 35, H - 35]
    ]
    ctx.strokeStyle = rarity === 'ur' ? '#FFD700' : '#00ffff'
    ctx.lineWidth = 3
    ctx.lineCap = 'square'
    corners.forEach(([cx, cy], i) => {
      ctx.beginPath()
      const dirs = i === 0 ? [1, 1, 1, 1] : i === 1 ? [-1, 1, 1, 1] : i === 2 ? [1, -1, 1, 1] : [-1, -1, 1, 1]
      ctx.moveTo(cx + dirs[0] * cornerSize, cy)
      ctx.lineTo(cx, cy)
      ctx.lineTo(cx, cy + dirs[1] * cornerSize)
      ctx.stroke()
    })

    const gradTop = ctx.createLinearGradient(50, 0, W - 50, 0)
    gradTop.addColorStop(0, 'transparent')
    gradTop.addColorStop(0.2, '#00ffff')
    gradTop.addColorStop(0.5, '#ff00ff')
    gradTop.addColorStop(0.8, '#00ffff')
    gradTop.addColorStop(1, 'transparent')
    ctx.fillStyle = gradTop
    ctx.fillRect(50, 75, W - 100, 3)

    ctx.fillStyle = '#00ffff'
    ctx.font = '900 22px "Orbitron", "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)'
    ctx.shadowBlur = 10
    ctx.fillText('棱 镜   P R I S M', W / 2, 120)
    ctx.shadowBlur = 0

    ctx.fillStyle = hexToRgba('#e8e8ff', 0.5)
    ctx.font = '600 11px "Share Tech Mono", "Noto Sans SC", monospace'
    ctx.fillText('NEWS · SEE THE WORLD DIFFERENTLY', W / 2, 145)

    ctx.fillStyle = hexToRgba('#8888aa', 0.6)
    ctx.font = '400 10px "Share Tech Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText(dateStr, 55, 60)
    ctx.textAlign = 'right'
    ctx.fillText(issueNum, W - 55, 60)

    let characterImg = null
    let isCardImage = false
    
    const cardImgPath = perspective?.card_image ? getCardImagePath(perspective.card_image) : null
    const localImgPath = perspective?.local_image ? getLocalImagePath(perspective.local_image) : null
    
    if (cardImgPath) {
      try {
        characterImg = await loadImage(cardImgPath)
        isCardImage = true
      } catch (e) {
        characterImg = null
      }
    }
    
    if (!characterImg && localImgPath) {
      try {
        characterImg = await loadImage(localImgPath)
        isCardImage = false
      } catch (e) {
        characterImg = null
      }
    }

    const avatarCenterY = 310
    const avatarRadius = 90

    ctx.save()
    ctx.beginPath()
    ctx.arc(W / 2, avatarCenterY, avatarRadius + 8, 0, Math.PI * 2)
    const avatarGlow = ctx.createRadialGradient(W / 2, avatarCenterY, avatarRadius - 10, W / 2, avatarCenterY, avatarRadius + 30)
    avatarGlow.addColorStop(0, hexToRgba(rarityColor, 0.4))
    avatarGlow.addColorStop(1, 'transparent')
    ctx.fillStyle = avatarGlow
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.arc(W / 2, avatarCenterY, avatarRadius, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    if (characterImg) {
      const imgSize = avatarRadius * 2
      if (isCardImage) {
        const sourceSize = Math.min(characterImg.width, characterImg.height)
        const sourceX = (characterImg.width - sourceSize) / 2
        const sourceY = 0
        ctx.drawImage(
          characterImg,
          sourceX, sourceY,
          sourceSize, sourceSize,
          W / 2 - avatarRadius, avatarCenterY - avatarRadius,
          imgSize, imgSize
        )
      } else {
        ctx.drawImage(characterImg, W / 2 - avatarRadius, avatarCenterY - avatarRadius, imgSize, imgSize)
      }
    } else {
      ctx.fillStyle = 'rgba(17, 17, 24, 0.9)'
      ctx.fillRect(W / 2 - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2)
      ctx.font = '80px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(perspective?.emoji || '🎴', W / 2, avatarCenterY)
    }
    ctx.restore()

    ctx.beginPath()
    ctx.arc(W / 2, avatarCenterY, avatarRadius, 0, Math.PI * 2)
    ctx.strokeStyle = rarityColor
    ctx.lineWidth = 4
    ctx.shadowColor = hexToRgba(rarityColor, 0.5)
    ctx.shadowBlur = 12
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.beginPath()
    ctx.arc(W / 2, avatarCenterY, avatarRadius + 5, 0, Math.PI * 2)
    ctx.strokeStyle = hexToRgba(rarityColor, 0.25)
    ctx.lineWidth = 1
    ctx.stroke()

    const badgeWidth = 90
    const badgeHeight = 26
    const badgeX = W / 2 - badgeWidth / 2
    const badgeY = avatarCenterY + avatarRadius - 10
    ctx.fillStyle = rarityColor
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 13)
    ctx.fill()
    ctx.fillStyle = rarity === 'ur' ? '#0a0a0f' : '#e8e8ff'
    ctx.font = '800 13px "Orbitron", "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`✦ ${rarityLabel} ✦`, W / 2, badgeY + badgeHeight / 2)
    ctx.textBaseline = 'alphabetic'

    ctx.fillStyle = '#e8e8ff'
    ctx.font = '900 42px "Orbitron", "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    const name = perspective?.name || '未知身份'
    ctx.shadowColor = 'rgba(0, 255, 255, 0.5)'
    ctx.shadowBlur = 8
    ctx.fillText(name, W / 2, 465)
    ctx.shadowBlur = 0

    if (perspective?.description) {
      ctx.fillStyle = hexToRgba('#8888aa', 0.7)
      ctx.font = '400 13px "Rajdhani", "Noto Sans SC", sans-serif'
      const desc = truncateText(perspective.description, 22)
      ctx.fillText(desc, W / 2, 495)
    }

    const dividerY = 535
    ctx.strokeStyle = hexToRgba('#00ffff', 0.3)
    ctx.lineWidth = 1
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(80, dividerY)
    ctx.lineTo(W - 80, dividerY)
    ctx.stroke()
    ctx.setLineDash([])

    const quoteMark = '"'
    ctx.fillStyle = hexToRgba('#ff00ff', 0.25)
    ctx.font = '900 80px "Orbitron", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(quoteMark, 70, 580)

    ctx.fillStyle = hexToRgba('#00ffff', 0.8)
    ctx.font = '700 13px "Share Tech Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText('◈ TODAY\'S QUOTE', 95, 575)

    if (newsTitle) {
      ctx.fillStyle = hexToRgba('#e8e8ff', 0.4)
      ctx.font = '400 11px "Rajdhani", "Noto Sans SC", sans-serif'
      ctx.textAlign = 'left'
      const truncatedTitle = truncateText(newsTitle, 28)
      ctx.fillText(`关于「${truncatedTitle}」`, 95, 600)
    }

    ctx.fillStyle = '#e8e8ff'
    ctx.font = '600 20px "Rajdhani", "Noto Sans SC", sans-serif'
    ctx.textAlign = 'left'
    const opinionText = opinion || perspective?.description || '换个视角看世界'
    const truncatedOpinion = truncateText(opinionText, 50)
    wrapText(ctx, `"${truncatedOpinion}"`, 95, 640, W - 150, 34)

    const sloganY = H - 195
    const gradSlogan = ctx.createLinearGradient(100, sloganY, W - 100, sloganY)
    gradSlogan.addColorStop(0, 'transparent')
    gradSlogan.addColorStop(0.5, '#00ffff')
    gradSlogan.addColorStop(1, 'transparent')
    ctx.fillStyle = hexToRgba('#00ffff', 0.06)
    ctx.fillRect(70, sloganY - 20, W - 140, 55)
    ctx.strokeStyle = hexToRgba('#00ffff', 0.25)
    ctx.lineWidth = 1
    ctx.strokeRect(70, sloganY - 20, W - 140, 55)

    ctx.fillStyle = '#00ffff'
    ctx.font = '700 16px "Orbitron", "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0, 255, 255, 0.6)'
    ctx.shadowBlur = 8
    ctx.fillText('BREAK THE COCOON', W / 2, sloganY + 2)
    ctx.shadowBlur = 0
    ctx.fillStyle = hexToRgba('#ff00ff', 0.9)
    ctx.font = '600 13px "Share Tech Mono", monospace'
    ctx.fillText('· SEE THE WORLD DIFFERENTLY ·', W / 2, sloganY + 26)

    const ctaY = H - 120
    ctx.fillStyle = hexToRgba('#00ffff', 0.1)
    roundRect(ctx, 80, ctaY - 5, W - 160, 40, 0)
    ctx.fill()
    ctx.strokeStyle = hexToRgba('#00ffff', 0.4)
    ctx.lineWidth = 1
    roundRect(ctx, 80, ctaY - 5, W - 160, 40, 0)
    ctx.stroke()

    ctx.fillStyle = '#00ffff'
    ctx.font = '700 14px "Orbitron", "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0, 255, 255, 0.6)'
    ctx.shadowBlur = 6
    ctx.fillText('START NOW  →  prism-news.app', W / 2, ctaY + 20)
    ctx.shadowBlur = 0

    ctx.fillStyle = hexToRgba('#8888aa', 0.4)
    ctx.font = '400 10px "Share Tech Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('© 2026 PRISM NEWS · SEE DIFFERENTLY', W / 2, H - 55)

    setDataUrl(canvas.toDataURL('image/png'))
    setGenerated(true)
  }, [perspective, opinion, newsTitle])

  useEffect(() => {
    const timer = setTimeout(() => generatePoster(), 150)
    return () => clearTimeout(timer)
  }, [generatePoster])

  const handleDownload = () => {
    if (!dataUrl) return
    const link = document.createElement('a')
    link.download = `棱镜新闻-${perspective?.name || '视角'}-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }

  const handleShare = async () => {
    if (!dataUrl) return
    try {
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `棱镜新闻-${perspective?.name}.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `我在棱镜新闻抽到了「${perspective?.name}」`,
          text: opinion || '换个视角看世界',
          files: [file]
        })
      } else {
        handleDownload()
      }
    } catch (err) {
      handleDownload()
    }
  }

  return (
    <div className="share-poster-overlay" onClick={onClose}>
      <div className="share-poster-modal" onClick={e => e.stopPropagation()}>
        <button className="poster-close-btn" onClick={onClose}>✕</button>

        <h3 className="poster-title">生成视角海报</h3>
        <p className="poster-subtitle">保存或分享你的专属视角卡片</p>

        <div className="poster-preview">
          {!generated && (
            <div className="poster-generating">
              <div className="poster-spinner"></div>
              <p>正在生成海报...</p>
            </div>
          )}
          {dataUrl && (
            <img src={dataUrl} alt="视角海报" className="poster-image" />
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className="poster-actions">
          <button className="poster-btn poster-btn-download" onClick={handleDownload}>
            <span>⬇</span> 保存海报
          </button>
          <button className="poster-btn poster-btn-share" onClick={handleShare}>
            <span>⌘</span> 分享
          </button>
        </div>

        <p className="poster-hint">海报已包含你的身份信息和今日观点金句</p>
      </div>
    </div>
  )
}

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = text.split('')
  let line = ''
  let currentY = y
  let lines = 0
  const maxLines = 4

  for (let i = 0; i < chars.length && lines < maxLines; i++) {
    const testLine = line + chars[i]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line.length > 0) {
      if (lines === maxLines - 1 && i < chars.length - 1) {
        let lastLine = line
        while (ctx.measureText(lastLine + '...').width > maxWidth && lastLine.length > 0) {
          lastLine = lastLine.slice(0, -1)
        }
        ctx.fillText(lastLine + '...', x, currentY)
      } else {
        ctx.fillText(line, x, currentY)
      }
      line = chars[i]
      currentY += lineHeight
      lines++
    } else {
      line = testLine
    }
  }
  if (lines < maxLines && line) {
    ctx.fillText(line, x, currentY)
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export default SharePoster
