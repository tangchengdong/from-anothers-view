import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import { useAppStore } from '../store/useAppStore'
import './Header.css'

function Header() {
  const navigate = useNavigate()
  const { user, isLoggedIn, logout } = useUserStore()
  const { resetSelection } = useAppStore()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleLogoClick = (e) => {
    e.preventDefault()
    resetSelection()
    navigate('/')
  }

  return (
    <header className="header header-paper">
      <div className="header-container">
        <Link to="/" className="logo" onClick={handleLogoClick}>
          <div className="logo-text">
            <h1>
              <span className="logo-serif">棱镜</span>
            </h1>
          </div>
        </Link>
        <nav className="nav">
          <Link to="/discover" className="nav-link nav-link-paper">发现</Link>
          <Link to="/profile" className="nav-link nav-link-paper">收藏</Link>
          {isLoggedIn ? (
            <div className="nav-user">
              <Link to="/profile" className="nav-avatar nav-avatar-paper">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </Link>
              <button className="nav-logout-btn nav-logout-paper" onClick={handleLogout}>
                退出
              </button>
            </div>
          ) : (
            <Link to="/login" className="nav-link nav-link-paper nav-login-paper">登录</Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header