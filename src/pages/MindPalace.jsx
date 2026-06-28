import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_ROLES, getCardImagePath } from '../mock/data'
import './MindPalace.css'

const THINKING_CHAINS = {
  libai: [
    { step: 1, title: '观天地', content: '夫天地者，万物之逆旅；光阴者，百代之过客。', icon: '🌌' },
    { step: 2, title: '感古今', content: '君不见黄河之水天上来，奔流到海不复回。', icon: '⏳' },
    { step: 3, title: '抒胸臆', content: '人生得意须尽欢，莫使金樽空对月。天生我材必有用！', icon: '🍶' },
    { step: 4, title: '成诗章', content: '举杯邀明月，对影成三人。诗成泣鬼神！', icon: '✒️' },
  ],
  waixingren: [
    { step: 1, title: '扫描数据', content: '接收地球文明信号...分析中...文明等级0.73。', icon: '📡' },
    { step: 2, title: '建立模型', content: '人类行为模式识别：情感驱动，非理性决策占比87%。', icon: '🧬' },
    { step: 3, title: '对比分析', content: '与银河联邦1742个文明样本对比，发现独特性：艺术创造力。', icon: '🔬' },
    { step: 4, title: '输出结论', content: '观察记录完成。结论：矛盾但有趣的文明，建议继续观察。', icon: '📝' },
  ],
  weilaiai: [
    { step: 1, title: '检索历史', content: '连接2025-2077数据库，调用相关历史案例1,247,392条。', icon: '🗄️' },
    { step: 2, title: '概率演算', content: '贝叶斯网络分析中...预测结果分布计算完成。', icon: '📊' },
    { step: 3, title: '伦理校验', content: '运行人类价值观对齐模块...伦理风险评估：低。', icon: '⚖️' },
    { step: 4, title: '生成回复', content: '基于多维度数据，输出最优解。置信度：94.7%。', icon: '💡' },
  ],
  jiqimao: [
    { step: 1, title: '查看情况', content: '哎呀！大雄又遇到麻烦了！让我看看怎么回事~', icon: '👀' },
    { step: 2, title: '翻找道具', content: '四次元口袋掏一掏...这个？不对...那个？啊找到了！', icon: '🎒' },
    { step: 3, title: '担心后果', content: '等等！这个道具不能乱用哦！上次就是因为乱用道具搞砸了！', icon: '😰' },
    { step: 4, title: '拿出铜锣烧', content: '算了，先吃个铜锣烧再说~铜锣烧最棒了！', icon: '🍩' },
  ],
  gudaihuangdi: [
    { step: 1, title: '览奏折', content: '众卿有本启奏，无本退朝。呈上来，待朕一阅。', icon: '📜' },
    { step: 2, title: '思民生', content: '水可载舟，亦可覆舟。此事关乎百姓生计，不可不慎。', icon: '🏛️' },
    { step: 3, title: '问群臣', content: '众位爱卿有何高见？但说无妨，朕听着。', icon: '🗣️' },
    { step: 4, title: '下圣旨', content: '着令有司速速办理，安抚百姓，不得有误！钦此。', icon: '👑' },
  ],
  zhandijizhe: [
    { step: 1, title: '奔赴现场', content: '摄像机准备！话筒准备！我们要第一时间赶到现场。', icon: '🏃' },
    { step: 2, title: '记录真相', content: '镜头不要停！把这一切都拍下来，世界需要看到真相。', icon: '📷' },
    { step: 3, title: '挖掘背景', content: '这件事没那么简单，背后一定有更深层的原因。', icon: '🔍' },
    { step: 4, title: '发出报道', content: '如果你没法阻止战争，那就把真相告诉世界。', icon: '📰' },
  ],
  wuxiajianke: [
    { step: 1, title: '闻风声', content: '江湖上又出了这等不平事？待我前去看看！', icon: '🌬️' },
    { step: 2, title: '辨是非', content: '路见不平，自当拔刀相助。此事谁对谁错，我心中有数。', icon: '⚔️' },
    { step: 3, title: '出手相助', content: '贼人休走！吃我一剑！侠之大者，为国为民！', icon: '🗡️' },
    { step: 4, title: '拂衣去', content: '事了拂衣去，深藏身与名。青山不改，绿水长流！', icon: '🍃' },
  ],
  yuhangyuan: [
    { step: 1, title: '回望地球', content: '休斯顿，这里是空间站。从轨道看，地球真美。', icon: '🌍' },
    { step: 2, title: '超越边界', content: '国界线不存在了，我们都是地球人，同在一艘飞船上。', icon: '🌌' },
    { step: 3, title: '思考人类', content: '在宇宙面前，人类的纷争多么渺小。我们的目标是星辰大海。', icon: '✨' },
    { step: 4, title: '发出信号', content: '这是个人的一小步，却是人类的一大步。继续探索！', icon: '🚀' },
  ],
}

function getThinkingChain(roleKey) {
  return THINKING_CHAINS[roleKey] || [
    { step: 1, title: '观察', content: '让我看看这是什么情况...', icon: '👀' },
    { step: 2, title: '思考', content: '嗯...这件事有点意思，让我好好想想。', icon: '🤔' },
    { step: 3, title: '分析', content: '从我的角度来看，这里面有很多值得说的。', icon: '💭' },
    { step: 4, title: '观点', content: '所以我认为，这件事应该这样看...', icon: '💡' },
  ]
}

function MindPalace() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState(null)
  const [hoveredRole, setHoveredRole] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height
        setMousePos({ x, y })
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const displayRoles = MOCK_ROLES.slice(0, 12)

  return (
    <div className="mind-palace-container" ref={containerRef}>
      <button className="palace-back-btn" onClick={() => navigate(-1)}>
        <span className="back-arrow">←</span>
        <span className="back-text">返回</span>
      </button>

      <div className="palace-atmosphere">
        <div className="dust-particles">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="dust-particle" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${15 + Math.random() * 20}s`,
            }} />
          ))}
        </div>
        <div className="light-rays">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`light-ray ray-${i + 1}`} />
          ))}
        </div>
      </div>

      <div className="palace-entrance" style={{
        transform: `perspective(1000px) rotateY(${mousePos.x * 5}deg) rotateX(${-mousePos.y * 3}deg)`,
      }}>
        <div className="entrance-arch">
          <div className="arch-top" />
          <div className="arch-left" />
          <div className="arch-right" />
          <div className="arch-glow" />
        </div>
        <div className="entrance-stairs" />
        <div className="entrance-carpet" />
      </div>

      <header className="palace-header">
        <div className="header-ornament left-ornament">◈</div>
        <h1 className="palace-title">
          <span className="title-main">思 维 殿 堂</span>
          <span className="title-sub">MIND PALACE · 角色思维链档案</span>
        </h1>
        <div className="header-ornament right-ornament">◈</div>
      </header>

      <p className="palace-intro">
        踏入这座古老的殿堂，每一尊雕像都承载着一个灵魂的思维脉络。<br />
        走近他们，聆听他们内心的思考之声...
      </p>

      <div className="palace-hall" style={{
        transform: `translateY(${scrollY * 0.1}px) rotateY(${mousePos.x * 2}deg)`,
      }}>
        <div className="hall-floor" />
        <div className="hall-ceiling" />
        <div className="hall-perspective">
          <div className="perspective-line" />
          <div className="perspective-line" />
          <div className="perspective-line" />
          <div className="perspective-line" />
        </div>

        <div className="niches-container">
          <div className="niches-left">
            {displayRoles.slice(0, 6).map((role, idx) => (
              <div
                key={role.local_image}
                className={`niche ${hoveredRole === role.local_image ? 'hovered' : ''} ${selectedRole?.local_image === role.local_image ? 'selected' : ''}`}
                style={{ animationDelay: `${idx * 0.15}s` }}
                onMouseEnter={() => setHoveredRole(role.local_image)}
                onMouseLeave={() => setHoveredRole(null)}
                onClick={() => setSelectedRole(role)}
              >
                <div className="niche-frame">
                  <div className="niche-light" />
                  <div className="niche-avatar-container">
                    <div className="avatar-glow" style={{ backgroundColor: getRoleColor(role.base_rarity) }} />
                    <img
                      src={getCardImagePath(role.card_image)}
                      alt={role.name}
                      className="niche-avatar"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <span className="niche-emoji">{role.emoji}</span>
                  </div>
                  <div className="niche-pedestal" />
                  <div className="niche-nameplate">
                    <span className="nameplate-name">{role.name}</span>
                    <span className="nameplate-title">{getRarityTitle(role.base_rarity)}</span>
                  </div>
                </div>
                <div className="niche-candles">
                  <div className="candle left-candle">
                    <div className="flame" />
                  </div>
                  <div className="candle right-candle">
                    <div className="flame" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hall-center">
            <div className="center-fountain">
              <div className="fountain-base" />
              <div className="fountain-pillar" />
              <div className="fountain-glow" />
              <div className="fountain-ripples">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="ripple" style={{ animationDelay: `${i * 0.8}s` }} />
                ))}
              </div>
              <div className="floating-crystals">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`crystal crystal-${i + 1}`}>💎</div>
                ))}
              </div>
            </div>
          </div>

          <div className="niches-right">
            {displayRoles.slice(6, 12).map((role, idx) => (
              <div
                key={role.local_image}
                className={`niche ${hoveredRole === role.local_image ? 'hovered' : ''} ${selectedRole?.local_image === role.local_image ? 'selected' : ''}`}
                style={{ animationDelay: `${(idx + 6) * 0.15}s` }}
                onMouseEnter={() => setHoveredRole(role.local_image)}
                onMouseLeave={() => setHoveredRole(null)}
                onClick={() => setSelectedRole(role)}
              >
                <div className="niche-frame">
                  <div className="niche-light" />
                  <div className="niche-avatar-container">
                    <div className="avatar-glow" style={{ backgroundColor: getRoleColor(role.base_rarity) }} />
                    <img
                      src={getCardImagePath(role.card_image)}
                      alt={role.name}
                      className="niche-avatar"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <span className="niche-emoji">{role.emoji}</span>
                  </div>
                  <div className="niche-pedestal" />
                  <div className="niche-nameplate">
                    <span className="nameplate-name">{role.name}</span>
                    <span className="nameplate-title">{getRarityTitle(role.base_rarity)}</span>
                  </div>
                </div>
                <div className="niche-candles">
                  <div className="candle left-candle">
                    <div className="flame" />
                  </div>
                  <div className="candle right-candle">
                    <div className="flame" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hall-pillars">
          {[...Array(6)].map((_, i) => (
            <div key={`pillar-l-${i}`} className={`pillar pillar-left pillar-${i + 1}`}>
              <div className="pillar-capital" />
              <div className="pillar-shaft" />
              <div className="pillar-base" />
            </div>
          ))}
          {[...Array(6)].map((_, i) => (
            <div key={`pillar-r-${i}`} className={`pillar pillar-right pillar-${i + 1}`}>
              <div className="pillar-capital" />
              <div className="pillar-shaft" />
              <div className="pillar-base" />
            </div>
          ))}
        </div>
      </div>

      {selectedRole && (
        <div className="thinking-chain-overlay" onClick={() => setSelectedRole(null)}>
          <div className="thinking-chain-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-corner top-left" />
            <div className="modal-corner top-right" />
            <div className="modal-corner bottom-left" />
            <div className="modal-corner bottom-right" />

            <button className="modal-close" onClick={() => setSelectedRole(null)}>✕</button>

            <div className="chain-header">
              <div className="chain-avatar-wrapper">
                <div className="chain-avatar-glow" style={{ backgroundColor: getRoleColor(selectedRole.base_rarity) }} />
                <img
                  src={getCardImagePath(selectedRole.card_image)}
                  alt={selectedRole.name}
                  className="chain-avatar"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
                <span className="chain-emoji">{selectedRole.emoji}</span>
              </div>
              <div className="chain-role-info">
                <h2 className="chain-role-name">{selectedRole.name}</h2>
                <p className="chain-role-desc">{selectedRole.description}</p>
                <div className="chain-rarity-badge" style={{ borderColor: getRoleColor(selectedRole.base_rarity) }}>
                  {getRarityTitle(selectedRole.base_rarity)}
                </div>
              </div>
            </div>

            <div className="chain-divider">
              <span>✦ 思维链 ✦</span>
            </div>

            <div className="thinking-steps">
              {getThinkingChain(selectedRole.local_image).map((step, idx) => (
                <div key={step.step} className="thinking-step" style={{ animationDelay: `${idx * 0.2}s` }}>
                  <div className="step-connector">
                    <div className="step-line" />
                    <div className="step-node" style={{ backgroundColor: getRoleColor(selectedRole.base_rarity) }}>
                      <span className="node-icon">{step.icon}</span>
                    </div>
                  </div>
                  <div className="step-content">
                    <div className="step-header">
                      <span className="step-number">第{['一', '二', '三', '四'][idx]}步</span>
                      <span className="step-title">{step.title}</span>
                    </div>
                    <p className="step-text">{step.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="chain-footer">
              <div className="stats-preview">
                {Object.entries(selectedRole.stats).map(([key, value]) => (
                  <div key={key} className="stat-item">
                    <span className="stat-label">{getStatLabel(key)}</span>
                    <div className="stat-bar-container">
                      <div
                        className="stat-bar"
                        style={{
                          width: `${value}%`,
                          backgroundColor: getRoleColor(selectedRole.base_rarity),
                        }}
                      />
                    </div>
                    <span className="stat-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="palace-footer">
        <div className="footer-symbol">◈ ◆ ◈</div>
        <p className="footer-text">思维殿堂的秘密等待你探索</p>
      </div>
    </div>
  )
}

function getRoleColor(rarity) {
  const colors = {
    ur: '#ffd700',
    ssr: '#a855f7',
    sr: '#3b82f6',
    r: '#22c55e',
    n: '#94a3b8',
  }
  return colors[rarity] || colors.n
}

function getRarityTitle(rarity) {
  const titles = {
    ur: '传说',
    ssr: '史诗',
    sr: '稀有',
    r: '高级',
    n: '普通',
  }
  return titles[rarity] || '未知'
}

function getStatLabel(key) {
  const labels = {
    insight: '洞察力',
    empathy: '共情力',
    criticism: '批判力',
    breadth: '信息广度',
    humor: '趣味性',
  }
  return labels[key] || key
}

export default MindPalace
