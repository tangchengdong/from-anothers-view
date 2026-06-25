import React, { useState, useRef, useEffect, useCallback } from 'react'
import './SharePoster.css'

const RARITY_LABELS = {
  ur: '传说',
  ssr: '史诗',
  sr: '稀有',
  r: '高级',
  n: '普通'
}

const RARITY_COLORS = {
  ur: '#B8860B',
  ssr: '#8B2635',
  sr: '#8B5A4A',
  r: '#6B5A4A',
  n: '#A89680'
}

function SharePoster({ perspective, opinion, newsTitle, onClose }) {
  const canvasRef = useRef(null)
  const [generated, setGenerated] = useState(false)
  const [dataUrl, setDataUrl] = useState(null)

  const generatePoster = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 750
    const H = 1100
    canvas.width = W
    canvas.height = H

    const bgColor = '#2a1f24'
    const accentColor = perspective?.color || '#8B2635'
    const rarity = perspective?.rarity || 'n'
    const rarityColor = RARITY_COLORS[rarity] || '#A89680'
    const rarityLabel = RARITY_LABELS[rarity] || '普通'

    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, W, H)

    const grad1 = ctx.createRadialGradient(W * 0.2, H * 0.15, 0, W * 0.2, H * 0.15, 400)
    grad1.addColorStop(0, hexToRgba(accentColor, 0.15))
    grad1.addColorStop(1, 'transparent')
    ctx.fillStyle = grad1
    ctx.fillRect(0, 0, W, H)

    const grad2 = ctx.createRadialGradient(W * 0.8, H * 0.7, 0, W * 0.8, H * 0.7, 350)
    grad2.addColorStop(0, 'rgba(255, 179, 71, 0.08)')
    grad2.addColorStop(1, 'transparent')
    ctx.fillStyle = grad2
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = hexToRgba(accentColor, 0.3)
    ctx.lineWidth = 2
    ctx.strokeRect(30, 30, W - 60, H - 60)

    ctx.strokeStyle = hexToRgba(accentColor, 0.15)
    ctx.lineWidth = 1
    ctx.strokeRect(40, 40, W - 80, H - 80)

    ctx.fillStyle = hexToRgba(accentColor, 0.8)
    ctx.font = '600 14px "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('◆  棱镜新闻 · PRISM NEWS  ◆', W / 2, 85)

    ctx.strokeStyle = hexToRgba('#ffffff', 0.1)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(100, 105)
    ctx.lineTo(W - 100, 105)
    ctx.stroke()

    ctx.font = '60px serif'
    ctx.textAlign = 'center'
    ctx.fillText(perspective?.emoji || '🎴', W / 2, 200)

    ctx.fillStyle = rarityColor
    ctx.font = '600 16px "Noto Sans SC", sans-serif'
    ctx.fillText(`「${rarityLabel}」`, W / 2, 240)

    ctx.fillStyle = '#fff'
    ctx.font = '900 42px "Noto Serif SC", serif'
    const name = perspective?.name || '未知身份'
    ctx.fillText(name, W / 2, 300)

    ctx.fillStyle = hexToRgba('#ffffff', 0.5)
    ctx.font = '400 16px "Noto Sans SC", sans-serif'
    const desc = perspective?.description || ''
    wrapText(ctx, desc, W / 2, 340, W - 120, 24)

    if (perspective?.keywords && perspective.keywords.length > 0) {
      const keywords = perspective.keywords.slice(0, 4)
      const kwY = 400
      const kwSpacing = 80
      const kwStartX = W / 2 - ((keywords.length - 1) * kwSpacing) / 2
      keywords.forEach((kw, i) => {
        const x = kwStartX + i * kwSpacing
        ctx.fillStyle = hexToRgba(accentColor, 0.15)
        roundRect(ctx, x - 35, kwY - 18, 70, 30, 4)
        ctx.fill()
        ctx.strokeStyle = hexToRgba(accentColor, 0.4)
        ctx.lineWidth = 1
        roundRect(ctx, x - 35, kwY - 18, 70, 30, 4)
        ctx.stroke()
        ctx.fillStyle = hexToRgba('#ffffff', 0.7)
        ctx.font = '500 13px "Noto Sans SC", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(kw, x, kwY + 2)
      })
    }

    ctx.strokeStyle = hexToRgba(accentColor, 0.3)
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(80, 460)
    ctx.lineTo(W - 80, 460)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = hexToRgba(accentColor, 0.7)
    ctx.font = '600 14px "Noto Sans SC", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('◈ 今日观点', 80, 500)

    if (newsTitle) {
      ctx.fillStyle = hexToRgba('#ffffff', 0.4)
      ctx.font = '400 13px "Noto Sans SC", sans-serif'
      ctx.textAlign = 'left'
      const truncatedTitle = newsTitle.length > 30 ? newsTitle.slice(0, 30) + '...' : newsTitle
      ctx.fillText(`关于「${truncatedTitle}」`, 80, 530)
    }

    ctx.fillStyle = '#fff'
    ctx.font = 'italic 600 22px "Noto Serif SC", serif'
    ctx.textAlign = 'left'
    const opinionText = opinion || perspective?.description || '换个视角看世界'
    wrapText(ctx, `"${opinionText}"`, 80, 575, W - 160, 36)

    ctx.strokeStyle = hexToRgba('#ffffff', 0.1)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(80, H - 180)
    ctx.lineTo(W - 80, H - 180)
    ctx.stroke()

    ctx.fillStyle = hexToRgba('#ffffff', 0.4)
    ctx.font = '400 13px "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⚡ Built with TRAE · AI-Native IDE', W / 2, H - 145)

    ctx.fillStyle = hexToRgba('#ffffff', 0.3)
    ctx.font = '400 12px "Noto Sans SC", sans-serif'
    ctx.fillText('扫码体验棱镜新闻 · 打破信息茧房', W / 2, H - 120)

    ctx.fillStyle = hexToRgba('#ffffff', 0.2)
    ctx.font = '400 11px "Noto Sans SC", sans-serif'
    ctx.fillText('© 2024 棱镜新闻 PRISM NEWS', W / 2, H - 90)

    ctx.fillStyle = hexToRgba('#ffffff', 0.15)
    ctx.font = '400 10px "Noto Sans SC", sans-serif'
    ctx.fillText('看见不同，才能理解不同', W / 2, H - 65)

    setDataUrl(canvas.toDataURL('image/png'))
    setGenerated(true)
  }, [perspective, opinion, newsTitle])

  useEffect(() => {
    const timer = setTimeout(() => generatePoster(), 100)
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

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, currentY)
      line = chars[i]
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
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
