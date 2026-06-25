import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import { useAppStore } from '../store/useAppStore'
import {
  getFavorites, getPreferences, updatePreferences,
  getProfile, updateProfile,
} from '../api/user'
import ContentItem from '../components/ContentItem'
import './Profile.css'

const perspectiveOptions = [
  { id: 'female', name: '她视角' },
  { id: 'genz', name: 'Z世代' },
  { id: 'parent', name: '父母辈' },
  { id: 'creator', name: '创作者' },
  { id: 'tech', name: '科技控' },
  { id: 'lifestyle', name: '生活家' },
  { id: 'lgbtq', name: '酷儿视角' },
  { id: 'environment', name: '环保视角' },
  { id: 'disability', name: '无障碍视角' },
  { id: 'rural', name: '乡村视角' },
  { id: 'elderly', name: '银发视角' },
  { id: 'global', name: '国际视角' },
]

const interestOptions = [
  '科技', '编程', '数码', '时尚', '美妆', '游戏', '动漫',
  '养生', '育儿', '自媒体', '写作', '美食', '旅行', '咖啡',
  '环保', '可持续', 'LGBTQ', '平权', '无障碍', '公益',
  '乡村', '农业', '养老', '国际', '外交', '运动', '阅读',
]

const regionOptions = ['一线城市', '二三线城市', '县城', '乡镇', '农村']
const genderOptions = ['男', '女', '非二元', '不愿透露']

function Profile() {
  const user = useUserStore((state) => state.user)
  const logout = useUserStore((state) => state.logout)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('favorites')
  const [favorites, setFavorites] = useState([])
  const [defaultPerspective, setDefaultPerspective] = useState('female')
  const [loading, setLoading] = useState(true)

  // 画像相关状态
  const [profile, setProfile] = useState({
    age: 25, gender: '', occupation: '', region: '', interests: [],
  })
  const [circles, setCircles] = useState([])
  const [circleNames, setCircleNames] = useState([])
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [favRes, prefRes, profileRes] = await Promise.all([
        getFavorites(),
        getPreferences(),
        getProfile(),
      ])
      setFavorites(favRes.data || [])
      setDefaultPerspective(prefRes.data?.default_perspective || 'female')
      if (profileRes.data && Object.keys(profileRes.data).length > 0) {
        setProfile(profileRes.data)
      }
      if (profileRes.circles) {
        setCircles(profileRes.circles)
        setCircleNames(profileRes.circle_names || [])
      }
    } catch (err) {
      console.error('加载失败', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const handlePerspectiveChange = async (pid) => {
    setDefaultPerspective(pid)
    try {
      await updatePreferences({ default_perspective: pid })
    } catch (e) {}
  }

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleInterestToggle = (interest) => {
    setProfile(prev => {
      const interests = prev.interests || []
      if (interests.includes(interest)) {
        return { ...prev, interests: interests.filter(i => i !== interest) }
      } else {
        return { ...prev, interests: [...interests, interest] }
      }
    })
  }

  const handleProfileSave = async () => {
    setProfileSaving(true)
    setProfileMessage('')
    try {
      const res = await updateProfile(profile)
      if (res.success) {
        setCircles(res.circles || [])
        setCircleNames(res.circle_names || [])
        setProfileMessage(res.message || '画像保存成功')
        setTimeout(() => setProfileMessage(''), 4000)
      } else {
        setProfileMessage(res.message || '保存失败')
      }
    } catch (err) {
      setProfileMessage('保存失败，请重试')
    } finally {
      setProfileSaving(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.nickname?.[0] || '破'}
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{user?.nickname || user?.username}</h1>
            <p className="profile-join-time">加入时间：{user?.created_at}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <div className="stat-number">{favorites.length}</div>
            <div className="stat-label">收藏</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">{user?.favorites_count || 0}</div>
            <div className="stat-label">点赞</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">{perspectiveOptions.find(p => p.id === defaultPerspective)?.name || '-'}</div>
            <div className="stat-label">默认视角</div>
          </div>
        </div>

        {/* 破茧状态提示 */}
        {circleNames.length > 0 && (
          <div className="cocoon-breaker-status">
            <span className="cb-icon">🦋</span>
            <div className="cb-text">
              <span className="cb-title">破茧模式已开启</span>
              <span className="cb-desc">
                已识别您属于 {circleNames.join('、')}，将为您屏蔽同质化内容
              </span>
            </div>
          </div>
        )}

        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            我的收藏
          </button>
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            我的画像
          </button>
          <button
            className={`profile-tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            偏好设置
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'favorites' && (
            <div className="favorites-section">
              {loading ? (
                <div className="section-loading">加载中...</div>
              ) : favorites.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔖</div>
                  <p className="empty-text">还没有收藏内容</p>
                  <p className="empty-hint">去探索感兴趣的资讯吧</p>
                </div>
              ) : (
                <div className="favorites-grid">
                  {favorites.map((item, index) => (
                    <ContentItem key={item.id} content={item} index={index} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <h3 className="section-title">🦋 我的画像</h3>
                <p className="section-desc">
                  填写你的真实画像，系统将识别你的信息圈层，主动屏蔽与你高度重合的同质化内容，让你看到更广阔的世界
                </p>
              </div>

              {/* 年龄 */}
              <div className="profile-field">
                <label className="field-label">年龄</label>
                <div className="age-slider-wrap">
                  <input
                    type="range"
                    min="18"
                    max="80"
                    value={profile.age || 25}
                    onChange={(e) => handleProfileChange('age', parseInt(e.target.value))}
                    className="age-slider"
                  />
                  <span className="age-value">{profile.age || 25} 岁</span>
                </div>
              </div>

              {/* 性别 */}
              <div className="profile-field">
                <label className="field-label">性别</label>
                <div className="option-group">
                  {genderOptions.map(g => (
                    <button
                      key={g}
                      className={`option-btn ${profile.gender === g ? 'active' : ''}`}
                      onClick={() => handleProfileChange('gender', g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* 职业 */}
              <div className="profile-field">
                <label className="field-label">职业</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="如：程序员、教师、自媒体博主..."
                  value={profile.occupation || ''}
                  onChange={(e) => handleProfileChange('occupation', e.target.value)}
                />
              </div>

              {/* 地域 */}
              <div className="profile-field">
                <label className="field-label">所在地域</label>
                <div className="option-group">
                  {regionOptions.map(r => (
                    <button
                      key={r}
                      className={`option-btn ${profile.region === r ? 'active' : ''}`}
                      onClick={() => handleProfileChange('region', r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* 兴趣 */}
              <div className="profile-field">
                <label className="field-label">兴趣领域（可多选）</label>
                <div className="interest-group">
                  {interestOptions.map(i => (
                    <button
                      key={i}
                      className={`interest-btn ${(profile.interests || []).includes(i) ? 'active' : ''}`}
                      onClick={() => handleInterestToggle(i)}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* 保存按钮 */}
              <div className="profile-save-area">
                {profileMessage && (
                  <div className={`profile-message ${profileMessage.includes('失败') ? 'error' : 'success'}`}>
                    {profileMessage}
                  </div>
                )}
                <button
                  className="profile-save-btn"
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                >
                  {profileSaving ? '保存中...' : '保存画像并开启破茧'}
                </button>
              </div>

              {/* 圈层识别结果 */}
              {circleNames.length > 0 && (
                <div className="circles-result">
                  <h4 className="circles-title">已识别的圈层</h4>
                  <div className="circles-tags">
                    {circleNames.map(name => (
                      <span key={name} className="circle-tag">{name}</span>
                    ))}
                  </div>
                  <p className="circles-hint">
                    这些圈层的高度相关内容将被自动过滤，帮助你看到圈外的声音
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="preferences-section">
              <h3 className="section-title">默认视角</h3>
              <p className="section-desc">选择你感兴趣的视角，首页将默认展示该视角内容</p>
              <div className="perspective-options">
                {perspectiveOptions.map((p) => (
                  <button
                    key={p.id}
                    className={`perspective-option ${defaultPerspective === p.id ? 'active' : ''}`}
                    onClick={() => handlePerspectiveChange(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
