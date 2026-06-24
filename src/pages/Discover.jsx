import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import StreamFeed from '../components/StreamFeed'
import PerspectiveSummary from '../components/PerspectiveSummary'
import PerspectivePicker from '../components/PerspectivePicker'
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

function Discover() {
  const navigate = useNavigate()
  const { selectedPerspectives, itemsPerPerspective, selectedSubcategory, setSelectedPerspectives, setSubcategory, resetSelection } = useAppStore()
  const [showPickerModal, setShowPickerModal] = useState(false)

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

  return (
    <div className="discover-page">
      {hasContent && (
        <>
          <div className="newspaper-masthead">
            <div className="masthead-top">
              <span>{formatDate()}</span>
              <span>棱镜新闻 · PRISM NEWS</span>
              <span>第 1 期</span>
            </div>
            <Link to="/" className="masthead-title-link" onClick={handleMastheadClick}>
              <h1 className="masthead-title font-serif">棱 镜</h1>
            </Link>
            <p className="masthead-subtitle">— 换个视角看世界 —</p>
            <div className="masthead-rule">
              <div className="section-divider"></div>
              <span>打破信息茧房 · 多元观点呈现</span>
              <div className="section-divider"></div>
            </div>
          </div>

          <button
            className="change-identity-btn"
            onClick={() => setShowPickerModal(true)}
          >
            <span className="btn-icon">※</span>
            <span className="btn-text">{isMultiPerspective ? '换身份组' : '换个身份'}</span>
          </button>
        </>
      )}

      {hasContent && (
        <>
          {isMultiPerspective ? (
            <div className="multi-perspective-container">
              {selectedPerspectives.map((perspective, idx) => (
                <div key={idx} className="perspective-section">
                  <PerspectiveSummary perspective={perspective} compact={true} />
                  <StreamFeed
                    perspective={perspective}
                    subcategory={selectedSubcategory}
                    onSubcategoryChange={handleSubcategoryChange}
                    limit={itemsPerPerspective}
                    sectionTitle={`${perspective.emoji} ${perspective.name} 专栏`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              <PerspectiveSummary perspective={firstPerspective} compact={true} />
              <StreamFeed
                perspective={firstPerspective}
                subcategory={selectedSubcategory}
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
    </div>
  )
}

export default Discover
