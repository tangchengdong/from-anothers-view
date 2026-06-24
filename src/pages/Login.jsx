import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import { login as apiLogin } from '../api/auth'
import './Login.css'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useUserStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiLogin(username, password)
      login(res.user, res.token)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || '登录失败，请检查账号密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">欢迎回来，破茧者</h1>
          <p className="login-subtitle">登录以获取个性化资讯体验</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="login-footer">
          <p className="demo-hint">
            演示账号：<span className="demo-account">test / test123456</span>
          </p>
          <p className="register-link">
            还没有账号？<Link to="/register">立即注册</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
