import { useState, useEffect } from 'react'
import './PerspectivePicker.css'
import { getRandomPerspective, getSuggestedPerspectives, getLocalImagePath } from '../mock/data'

const VIEW_CLASS = {
  ur: { label: '传说', full: '传说角色', accent: '#B8860B' },
  ssr: { label: '史诗', full: '史诗角色', accent: '#6B3A7B' },
  sr: { label: '稀有', full: '稀有角色', accent: '#3D6B5A' },
  r: { label: '高级', full: '高级角色', accent: '#4A5568' },
  n: { label: '普通', full: '普通角色', accent: '#A89680' }
}

export default function PerspectivePicker({ onSelect, selectedPerspective }) {
  const [suggestions, setSuggestions] = useState([])
  const [customName, setCustomName] = useState('')
  const [drawnCard, setDrawnCard] = useState(null)
  const [drawnCards, setDrawnCards] = useState([])
  const [isFiveDraw, setIsFiveDraw] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [flippedIndices, setFlippedIndices] = useState([])
  const [imageLoadError, setImageLoadError] = useState({})

  useEffect(() => {
    loadSuggestions()
  }, [])

  const loadSuggestions = () => {
    const data = getSuggestedPerspectives(12)
    setSuggestions(data)
  }

  const resetDraw = () => {
    setDrawnCard(null)
    setDrawnCards([])
    setIsFlipped(false)
    setFlippedIndices([])
    setImageLoadError({})
  }

  const handleSingleDraw = async () => {
    setIsDrawing(true)
    resetDraw()
    setIsFiveDraw(false)
    await new Promise(resolve => setTimeout(resolve, 1000))
    const data = getRandomPerspective()
    setDrawnCard(data)
    setTimeout(() => {
      setIsFlipped(true)
      setIsDrawing(false)
    }, 200)
  }

  const handleFiveDraw = async () => {
    setIsDrawing(true)
    resetDraw()
    setIsFiveDraw(true)
    await new Promise(resolve => setTimeout(resolve, 600))
    const cards = []
    const usedNames = new Set()
    let attempts = 0
    while (cards.length < 5 && attempts < 50) {
      const card = getRandomPerspective()
      if (!usedNames.has(card.name)) {
        usedNames.add(card.name)
        cards.push(card)
      }
      attempts++
    }
    setDrawnCards(cards)
    for (let i = 0; i < (cards.length < 5 ? cards.length : 5); i++) {
      await new Promise(resolve => setTimeout(resolve, 180))
      setFlippedIndices(prev => [...prev, i])
    }
    setIsDrawing(false)
  }

  const handleSelectSingle = () => {
    if (drawnCard) onSelect([drawnCard], 20)
  }

  const handleSelectAllFive = () => {
    if (drawnCards.length === 5) onSelect(drawnCards, 5)
  }

  const handleSelectOneFromFive = (card) => {
    onSelect([card], 20)
  }

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (!customName.trim()) return
    const data = {
      name: customName.trim(),
      emoji: '✎',
      character_prompt: `custom character ${customName.trim()}, cartoon style, illustration`,
      description: `以「${customName.trim()}」的视角看世界`,
      keywords: [],
      rarity: 'n',
      rarity_name: '自定义角色',
      rarity_label: '自定义'
    }
    onSelect([data], 20)
    setCustomName('')
  }

  const handleSuggestionClick = (item) => {
    const viewClass = VIEW_CLASS[item.base_rarity] || VIEW_CLASS.n
    const data = {
      ...item,
      rarity: item.base_rarity || 'n',
      rarity_name: viewClass.full,
      rarity_label: viewClass.label
    }
    onSelect([data], 20)
  }

  const getViewClass = (rarity) => {
    return VIEW_CLASS[rarity] || VIEW_CLASS.n
  }

  const handleImageError = (cardId) => {
    setImageLoadError(prev => ({ ...prev, [cardId]: true }))
  }

  const getCharacterImageSources = (card) => {
    const sources = []
    if (card.local_image && !imageLoadError[`local_${card.local_image}`]) {
      sources.push({
        url: getLocalImagePath(card.local_image),
        isLocal: true,
        key: `local_${card.local_image}`
      })
    }
    if (card.character_prompt && !imageLoadError[`api_${card.name}`]) {
      sources.push({
        url: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(card.character_prompt)}&image_size=square`,
        isLocal: false,
        key: `api_${card.name}`
      })
    }
    return sources
  }

  const renderCard = (card, index, isInGrid = false) => {
    const flipped = isInGrid ? flippedIndices.includes(index) : isFlipped
    const viewClass = card ? getViewClass(card.rarity) : null
    const rarityClass = card ? `rarity-${card.rarity}` : ''
    const imageSources = card ? getCharacterImageSources(card) : []
    const hasLocalImage = card?.local_image && !imageLoadError[`local_${card.local_image}`]
    const hasAnyImage = imageSources.length > 0

    return (
      <div
        key={isInGrid ? index : 'single'}
        className={`card-container ${rarityClass} ${isDrawing && !isInGrid ? 'drawing' : ''} ${flipped ? 'flipped' : ''} ${hasLocalImage ? 'has-full-card' : ''}`}
        onClick={!isDrawing && !flipped && !isInGrid ? handleSingleDraw : undefined}
      >
        <div className="card-flip">
          <div className="card-face card-back">
            <img src={new URL('../assets/characters/kabei.png', import.meta.url).href} alt="卡背" className="kabei-image" />
          </div>
          {card && (
            <div className={`card-face card-front ${hasLocalImage ? 'full-card-image' : ''}`}>
              {hasLocalImage ? (
                <img
                  key={imageSources[0].key}
                  src={imageSources[0].url}
                  alt={card.name}
                  className="full-card-img"
                  loading="lazy"
                  onError={() => handleImageError(imageSources[0].key)}
                />
              ) : (
                <>
                  <div className="card-front-header">
                    <span className="editorial-badge" style={{ backgroundColor: viewClass?.accent }}>
                      {card.rarity_label}
                    </span>
                    {card.is_llm_generated && (
                      <span className="llm-badge">限定</span>
                    )}
                  </div>
                  <div className="card-image-container">
                    {hasAnyImage ? (
                      <img
                        key={imageSources[0].key}
                        src={imageSources[0].url}
                        alt={card.name}
                        className="card-character-image"
                        loading="lazy"
                        onError={() => handleImageError(imageSources[0].key)}
                      />
                    ) : null}
                    <div
                      className="card-emoji"
                      style={{ display: hasAnyImage ? 'none' : 'block' }}
                    >
                      {card.emoji}
                    </div>
                  </div>
                  <div className="card-role">{card.rarity_name}</div>
                  <div className="card-name">{card.name}</div>
                  <div className="card-desc">{card.description}</div>
                  <div className="card-keywords">
                    {(card.keywords || []).slice(0, isInGrid ? 3 : 5).map((kw, idx) => (
                      <span key={idx} className="card-keyword">{kw}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {isInGrid && flipped && (
          <button
            className="select-card-mini"
            onClick={(e) => { e.stopPropagation(); handleSelectOneFromFive(card) }}
          >
            选Ta
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="perspective-picker">
      <div className="picker-welcome">
        <h2>抽个视角</h2>
        <p>翻开一张身份卡，换个视角看新闻</p>
      </div>

      <div className="picker-section">
        <div className="draw-card-area">
          {!isFiveDraw ? (
            <>
              {renderCard(drawnCard, 0, false)}
              <div className="draw-buttons">
                {!isFlipped ? (
                  <>
                    <button className="draw-btn" onClick={handleSingleDraw} disabled={isDrawing}>
                      {isDrawing ? '洗牌中...' : '✎ 抽一张'}
                    </button>
                    <button className="draw-btn draw-btn-five" onClick={handleFiveDraw} disabled={isDrawing}>
                      五连抽
                    </button>
                  </>
                ) : (
                  <>
                    <button className="select-drawn-btn primary" onClick={handleSelectSingle}>
                      就用这个视角
                    </button>
                    <button className="redraw-btn" onClick={handleSingleDraw} disabled={isDrawing}>
                      再来一张
                    </button>
                    <button className="redraw-btn" onClick={handleFiveDraw} disabled={isDrawing}>
                      五连抽
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="five-cards-grid">
                {drawnCards.map((card, idx) => renderCard(card, idx, true))}
              </div>
              {flippedIndices.length === 5 && !isDrawing && (
                <>
                  <p className="five-draw-hint">可全部选上（每个视角展示5条资讯），或单独选一张</p>
                  <div className="draw-buttons">
                    <button className="select-drawn-btn primary" onClick={handleSelectAllFive}>
                      全部选上
                    </button>
                    <button className="redraw-btn" onClick={handleFiveDraw} disabled={isDrawing}>
                      再来一组
                    </button>
                    <button className="redraw-btn" onClick={handleSingleDraw} disabled={isDrawing}>
                      回单抽
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="picker-section">
        <h3 className="picker-section-title">
          <span>✎</span> 自定义角色
        </h3>
        <div className="custom-input-area">
          <form onSubmit={handleCustomSubmit} className="input-row">
            <input
              type="text"
              className="custom-input"
              placeholder="破茧者想让谁陪你看资讯？例如：李白、外星人、退休大爷..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
            <button type="submit" className="custom-submit-btn">
              就Ta了
            </button>
          </form>
          <p className="input-hint">输入你能想到的任何角色，越有趣越好玩</p>
        </div>
      </div>

      <div className="picker-section">
        <h3 className="picker-section-title">
          <span>✦</span> 角色图鉴
        </h3>
        <div className="suggestions-grid">
          {suggestions.slice(0, 12).map((item, index) => {
            const viewClass = getViewClass(item.base_rarity)
            const hasLocalImage = item.local_image && !imageLoadError[`local_${item.local_image}`]
            const thumbnailUrl = hasLocalImage ? getLocalImagePath(item.local_image) : null
            return (
              <div
                key={index}
                className={`suggestion-card ${hasLocalImage ? 'has-card-thumbnail' : ''}`}
                onClick={() => handleSuggestionClick(item)}
              >
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={item.name}
                    className="suggestion-card-thumbnail"
                    loading="lazy"
                    onError={() => handleImageError(`local_${item.local_image}`)}
                  />
                ) : (
                  <>
                    <span
                      className="suggestion-rarity"
                      style={{ backgroundColor: viewClass.accent }}
                    >
                      {viewClass.label}
                    </span>
                    <div className="suggestion-emoji">{item.emoji}</div>
                    <div className="suggestion-name">{item.name}</div>
                    <div className="suggestion-desc">{item.description}</div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
