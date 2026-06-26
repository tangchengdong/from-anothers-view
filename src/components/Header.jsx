import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import './Header.css'

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { resetSelection } = useAppStore()
  const isHome = location.pathname === '/'

  const handleLogoClick = (e) => {
    e.preventDefault()
    resetSelection()
    navigate('/')
  }

  const handleRedraw = () => {
    resetSelection()
    navigate('/')
  }

  return (
    <header className="header header-paper">
      <div className="header-container">
        <Link to="/" className="logo" onClick={handleLogoClick}>
          <div className="logo-text">
            <h1>
              <span className="logo-serif">棱 镜</span>
            </h1>
          </div>
        </Link>
        {!isHome && (
          <button className="redraw-header-btn" onClick={handleRedraw}>
            ✦ 重新抽卡
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
