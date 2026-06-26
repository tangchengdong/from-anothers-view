import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import SearchBox from '../components/SearchBox'
import StreamFeed from '../components/StreamFeed'
import PerspectiveSummary from '../components/PerspectiveSummary'
import PerspectivePicker from '../components/PerspectivePicker'
import PerspectiveComparison from '../components/PerspectiveComparison'
import SharePoster from '../components/SharePoster'
import BreakthroughToast from '../components/BreakthroughToast'
import { MOCK_ROLES } from '../mock/data'
import './Discover.css'

function formatDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const weekday = weekdays[now.getDay()]
  return `${year}年${month}月${day}日 ${weekday}`
}

function formatLunarDate() {
  const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
  const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
  const now = new Date()
  const seed = (now.getFullYear() * 366 + now.getMonth() * 31 + now.getDate()) % 360
  const monthIdx = Math.floor(seed / 30) % 12
  const dayIdx = seed % 30
  return `农历${lunarMonths[monthIdx]}月${lunarDays[dayIdx]}`
}

function formatWeather() {
  const weathers = ['晴 28℃', '多云 26℃', '阴 24℃', '小雨 22℃']
  return weathers[Math.floor(Math.random() * weathers.length)]
}

function getIssueNumber() {
  const startDate = new Date('2024-01-01')
  const now = new Date()
  const diff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24))
  return `第 ${diff + 1} 期`
}

function Discover() {
  const navigate = useNavigate()
  const { selectedPerspectives, itemsPerPerspective, setSelectedPerspectives, setSubcategory, resetSelection, readCount } = useAppStore()
  const [showPickerModal, setShowPickerModal] = useState(false)
  const [showSharePoster, setShowSharePoster] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [weather] = useState(formatWeather())
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const [highlightedPerspective, setHighlightedPerspective] = useState(null)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setScrollProgress(Math.min(progress, 100))
      setShowBackToTop(scrollTop > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubcategoryChange = (sub) => {
    setSubcategory(sub)
  }

  const handlePerspectiveSelect = (perspectives, itemsCount = 20) => {
    setSelectedPerspectives(perspectives, itemsCount)
    setShowPickerModal(false)
  }

  const handleMastheadClick = (e) => {
    e.preventDefault()
    resetSelection()
    navigate('/')
  }

  const isMultiPerspective = selectedPerspectives && selectedPerspectives.length > 1
  const firstPerspective = selectedPerspectives && selectedPerspectives.length === 1 ? selectedPerspectives[0] : null

  const hasContent = selectedPerspectives && selectedPerspectives.length > 0
  const sharePerspective = firstPerspective || (selectedPerspectives && selectedPerspectives[0])

  const isLargeScreen = windowWidth >= 1600

  const additionalPerspectives = useMemo(() => {
    if (!isLargeScreen || !selectedPerspectives || selectedPerspectives.length === 0 || selectedPerspectives.length === 1 || highlightedPerspective) return []
    const selectedNames = new Set(selectedPerspectives.map(p => p.name))
    const availableRoles = MOCK_ROLES.filter(r => !selectedNames.has(r.name))
    return availableRoles.sort(() => Math.random() - 0.5).slice(0, 3)
  }, [isLargeScreen, selectedPerspectives, highlightedPerspective])

  const displayPerspectives = useMemo(() => {
    if (!selectedPerspectives) return []
    if (highlightedPerspective) return [highlightedPerspective]
    return [...selectedPerspectives, ...additionalPerspectives]
  }, [selectedPerspectives, additionalPerspectives, highlightedPerspective])

  return (
    <div className="discover-page">
      <div className="reading-progress-bar">
        <div className="reading-progress-fill" style={{ width: `${scrollProgress}%` }} />
      </div>

      {hasContent && (
        <>
          <div className="newspaper-masthead">
            <div className="masthead-top">
              <span className="masthead-date">{formatDate()}</span>
              <span className="masthead-lunar">{formatLunarDate()}</span>
              <span className="masthead-weather">{weather}</span>
            </div>
            <Link to="/" className="masthead-title-link" onClick={handleMastheadClick}>
              <h1 className="masthead-title font-serif">棱 镜</h1>
            </Link>
            <p className="masthead-subtitle">— PRISM NEWS · 换个视角看世界 —</p>
            <div className="masthead-info-row">
              <span className="masthead-issue">{getIssueNumber()}</span>
              <span className="masthead-separator">·</span>
              <span className="masthead-vol">今日 {displayPerspectives.length * 5} 版</span>
              <span className="masthead-separator">·</span>
              <span className="masthead-price">零售价：打破茧房</span>
            </div>
            <div className="masthead-rule">
              <div className="section-divider"></div>
              <span className="masthead-motto">打破信息茧房 · 多元观点呈现 · 棱镜折射真相</span>
              <div className="section-divider"></div>
            </div>
          </div>

          <div className="discover-action-btns">
            <button
              className="change-identity-btn"
              onClick={() => setShowPickerModal(true)}
            >
              <span className="btn-icon">※</span>
              <span className="btn-text">{isMultiPerspective ? '换身份组' : '换个身份'}</span>
            </button>

            {sharePerspective && (
              <button
                className="share-poster-btn"
                onClick={() => setShowSharePoster(true)}
              >
                <span className="btn-icon">⌘</span>
                <span className="btn-text">生成海报</span>
              </button>
            )}
          </div>

          <SearchBox />
        </>
      )}

      {hasContent && (
        <>
          {isLargeScreen ? (
            <div className="multi-perspective-container">
              {isMultiPerspective && (
                <PerspectiveComparison 
                  perspectives={selectedPerspectives} 
                  onHighlightedPerspectiveChange={setHighlightedPerspective} 
                />
              )}
              <div className="perspective-columns">
                {displayPerspectives.map((perspective, idx) => {
                  const isAdditional = !highlightedPerspective && idx >= selectedPerspectives.length
                  return (
                    <div key={`${perspective.name}-${idx}`} className={`perspective-section ${isAdditional ? 'perspective-section-additional' : ''}`}>
                      <PerspectiveSummary perspective={perspective} compact={true} />
                      <StreamFeed
                        perspective={perspective}
                        subcategory={null}
                        onSubcategoryChange={handleSubcategoryChange}
                        limit={itemsPerPerspective}
                        sectionTitle={`${perspective.emoji} ${perspective.name} 专栏`}
                      />
                      {isAdditional && (
                        <div className="perspective-additional-badge">
                          随机推荐
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : isMultiPerspective ? (
            <div className="multi-perspective-container">
              <PerspectiveComparison 
                perspectives={selectedPerspectives} 
                onHighlightedPerspectiveChange={setHighlightedPerspective} 
              />
              <div className="perspective-columns">
                {displayPerspectives.map((perspective, idx) => {
                  const isAdditional = !highlightedPerspective && idx >= selectedPerspectives.length
                  return (
                    <div key={idx} className="perspective-section">
                      <PerspectiveSummary perspective={perspective} compact={true} />
                      <StreamFeed
                        perspective={perspective}
                        subcategory={null}
                        onSubcategoryChange={handleSubcategoryChange}
                        limit={itemsPerPerspective}
                        sectionTitle={`${perspective.emoji} ${perspective.name} 专栏`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <>
              <PerspectiveSummary perspective={firstPerspective} compact={true} />
              <StreamFeed
                perspective={firstPerspective}
                subcategory={null}
                onSubcategoryChange={handleSubcategoryChange}
                limit={itemsPerPerspective}
              />
            </>
          )}
        </>
      )}

      {showPickerModal && (
        <div className="picker-modal-overlay" onClick={() => setShowPickerModal(false)}>
          <div className="picker-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowPickerModal(false)}>✕</button>
            <PerspectivePicker
              onSelect={handlePerspectiveSelect}
              selectedPerspective={null}
            />
          </div>
        </div>
      )}

      {showSharePoster && sharePerspective && (
        <SharePoster
          perspective={sharePerspective}
          opinion={sharePerspective.description}
          onClose={() => setShowSharePoster(false)}
        />
      )}

      <BreakthroughToast
        readCount={readCount}
        perspectives={selectedPerspectives}
      />

      {showBackToTop && (
        <button
          className="back-to-top-btn"
          onClick={handleBackToTop}
          aria-label="回到顶部"
        >
          ↑
        </button>
      )}
    </div>
  )
}

export default Discover
