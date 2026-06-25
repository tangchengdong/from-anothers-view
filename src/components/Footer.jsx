import React from 'react'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer footer-paper">
      <div className="footer-content">
        <div className="footer-rule-top">
          <span>◆</span>
        </div>
        <p className="footer-tagline">看见不同，才能理解不同</p>
        <p className="footer-copyright">© 2024 棱镜新闻 · PRISM NEWS · 第壹期</p>
        
        <div className="trae-badge-block">
          <div className="trae-badge">
            <span className="trae-icon">⚡</span>
            <div className="trae-text">
              <span className="trae-label">Built with TRAE</span>
              <span className="trae-desc">AI-Native IDE 驱动创意落地</span>
            </div>
          </div>
          <p className="trae-story">
            本项目从创意构思到代码实现，全程借助 TRAE IDE 的 AI 辅助开发能力完成。
            角色人设生成、观点模板编写、报纸风格 CSS 调优，均在 TRAE 智能补全与对话式开发中高效产出。
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
