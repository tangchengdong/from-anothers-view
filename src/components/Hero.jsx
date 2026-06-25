import React from 'react'
import './Hero.css'

function Hero({ visible = true }) {
  return (
    <div className={`hero-wrapper ${visible ? '' : 'hidden'}`}>
      <section className={`hero dark-hero ${visible ? 'visible' : 'hidden'}`}>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span>破茧者计划</span>
          </div>
          
          <h1 className="hero-title">
            <span className="title-line">你看到的世界</span>
            <span className="title-gradient">只是算法想让你看到的</span>
          </h1>
          
          <p className="hero-subtitle">
            同一条新闻，1000个人有1000种解读<br/>
            抽一张身份卡，体验别人眼中的世界
          </p>

          <div className="hero-value-points">
            <div className="value-point">
              <span className="point-icon">◈</span>
              <span className="point-text">身份代入 · 沉浸体验</span>
            </div>
            <div className="value-point">
              <span className="point-icon">◈</span>
              <span className="point-text">观点碰撞 · 多元视角</span>
            </div>
            <div className="value-point">
              <span className="point-icon">◈</span>
              <span className="point-text">打破茧房 · 看见真实</span>
            </div>
          </div>

          <div className="hero-steps">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-text">抽张身份卡</div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-text">换个视角</div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-text">破茧而出</div>
            </div>
          </div>

          <div className="hero-feature-hint">
            <span className="hint-badge">五连抽</span>
            <span className="hint-text">同时抽取5个身份，体验圆桌讨论式观点碰撞</span>
          </div>
        </div>

        <div className="hero-scroll-hint">
          <span>↓ 开始抽卡 ↓</span>
        </div>
      </section>
    </div>
  )
}

export default Hero
