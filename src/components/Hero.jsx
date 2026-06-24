import React from 'react'
import './Hero.css'

function Hero({ visible = true }) {
  return (
    <div className={`hero-wrapper ${visible ? '' : 'hidden'}`}>
      <section className={`hero ${visible ? 'visible' : 'hidden'}`}>
        <div className="hero-content">
          <div className="hero-masthead">
            <div className="hero-issue">
              <span>2026年6月</span>
              <span className="hero-issue-dot">·</span>
              <span>创刊号</span>
            </div>
            <h1 className="hero-title">棱 镜</h1>
            <div className="hero-rule">
              <span className="hero-rule-line"></span>
              <span className="hero-rule-star">✦</span>
              <span className="hero-rule-line"></span>
            </div>
            <p className="hero-subtitle">换个视角看世界</p>
          </div>

          <div className="hero-mission">
            <p>打破算法茧房，看见不同人群眼中的真实世界</p>
          </div>

          <div className="hero-attributes">
            <div className="hero-attr">
              <span className="attr-label">趣味角色</span>
              <span className="attr-value">多元视角</span>
            </div>
            <div className="hero-attr">
              <span className="attr-label">抽卡体验</span>
              <span className="attr-value">惊喜探索</span>
            </div>
            <div className="hero-attr">
              <span className="attr-label">实时资讯</span>
              <span className="attr-value">千人千面</span>
            </div>
          </div>
        </div>

        <div className="hero-scroll">
          <span className="scroll-text">向下翻阅</span>
          <span className="scroll-arrow">↓</span>
        </div>
      </section>
    </div>
  )
}

export default Hero