import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import { register as apiRegister } from '../api/auth'
import './Login.css'

function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useUserStore((state) => state.login)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setError('请填写用户名和密码')
      return
    }
    if (password !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }
    if (password.length < 6) {
      setError('密码至少6位')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiRegister(username, password)
      login(res.user, res.token)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">加入破茧者</h1>
          <p className="login-subtitle">创建账号，开启多视角探索之旅</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="设置用户名"
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少6位密码"
            />
          </div>

          <div className="form-group">
            <label className="form-label">确认密码</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="login-footer">
          <p className="register-link">
            已有账号？<Link to="/login">立即登录</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
