const POSITIVE_WORDS = ['好', '支持', '赞', '棒', '妙', '优秀', '进步', '希望', '值得', '幸', '喜', '乐', '成功', '突破', '创新', '加油', '鼓励', '积极', '利好', '机遇', '精彩', '厉害', '满意', '欣慰', '可喜', '看好', '期待', '赞不绝口', '了不起', '不错', '优秀']
const NEGATIVE_WORDS = ['不好', '反对', '差', '糟', '危险', '担忧', '问题', '错误', '失败', '风险', '危机', '警告', '批评', '消极', '隐患', '堪忧', '可怕', '荒谬', '可笑', '悲哀', '可惜', '遗憾', '焦虑', '不满', '糟糕', '失望', '痛心', '无奈', '愤慨', '谴责']
const NEUTRAL_WORDS = ['观察', '记录', '分析', '认为', '觉得', '看来', '似乎', '可能', '也许', '大概', '据说', '据悉', '了解', '关注', '思考', '值得思考', '有趣', '有意思', '值得关注', '理性看待']

export function analyzeAttitude(opinion) {
  if (!opinion) return { attitude: 'neutral', score: 0, label: '中立', color: '#7F8C8D' }
  let pos = 0, neg = 0, neu = 0
  POSITIVE_WORDS.forEach(w => { if (opinion.includes(w)) pos++ })
  NEGATIVE_WORDS.forEach(w => { if (opinion.includes(w)) neg++ })
  NEUTRAL_WORDS.forEach(w => { if (opinion.includes(w)) neu++ })

  if (pos > neg && pos > neu) return { attitude: 'positive', score: pos, label: '积极看好', color: '#2D8B5F' }
  if (neg > pos && neg > neu) return { attitude: 'negative', score: neg, label: '担忧质疑', color: '#C0392B' }
  return { attitude: 'neutral', score: neu, label: '理性观察', color: '#8B7355' }
}

export function extractKeywords(opinion, maxLength = 3) {
  if (!opinion) return []
  const cleaned = opinion.replace(/[，。！？、；：""''（）\s\d~`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, ' ')
  const segments = cleaned.split(/\s+/).filter(s => s.length >= 2 && s.length <= 6)
  const freq = {}
  segments.forEach(s => { freq[s] = (freq[s] || 0) + 1 })

  const stopWords = ['这个', '那个', '就是', '但是', '不过', '因为', '所以', '如果', '虽然', '这种', '那种', '我们', '你们', '他们', '自己', '一个', '一些', '什么', '怎么', '为什么', '可以', '应该', '可能', '已经', '正在', '现在', '时候', '事情', '东西', '问题', '方面']
  const filtered = Object.entries(freq)
    .filter(([word]) => !stopWords.includes(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxLength)
    .map(([word]) => word)

  if (filtered.length === 0) {
    const phrases = opinion.match(/[\u4e00-\u9fa5]{2,4}/g) || []
    return phrases.filter(p => !stopWords.includes(p)).slice(0, maxLength)
  }
  return filtered
}

export function calculateCollision(opinions) {
  const attitudes = opinions.map(o => analyzeAttitude(o))
  const types = new Set(attitudes.map(a => a.attitude))
  const diversity = types.size
  const positive = attitudes.filter(a => a.attitude === 'positive').length
  const negative = attitudes.filter(a => a.attitude === 'negative').length
  const neutral = attitudes.filter(a => a.attitude === 'neutral').length

  let score = 0
  if (diversity >= 3) score += 40
  else if (diversity === 2) score += 25
  else score += 10

  if (positive > 0 && negative > 0) score += 30
  if (neutral > 0 && (positive > 0 || negative > 0)) score += 15
  score += Math.min(positive + negative, 5) * 3

  return Math.min(score, 100)
}

export function findConsensusAndDivergence(analyses) {
  if (!analyses || analyses.length < 2) return { consensus: null, divergence: null }

  const positiveCount = analyses.filter(a => a.attitude.attitude === 'positive').length
  const negativeCount = analyses.filter(a => a.attitude.attitude === 'negative').length
  const neutralCount = analyses.filter(a => a.attitude.attitude === 'neutral').length
  const total = analyses.length

  let consensus = null
  let divergence = null

  if (positiveCount >= total * 0.6) {
    consensus = '多数看好'
  } else if (negativeCount >= total * 0.6) {
    consensus = '普遍担忧'
  } else if (neutralCount >= total * 0.6) {
    consensus = '理性观望'
  }

  if (positiveCount > 0 && negativeCount > 0) {
    if (positiveCount > negativeCount) {
      divergence = '存在分歧，乐观者居多'
    } else if (negativeCount > positiveCount) {
      divergence = '存在分歧，质疑声不少'
    } else {
      divergence = '观点两极分化'
    }
  }

  return { consensus, divergence }
}

export const ATTITUDE_CONFIG = {
  positive: { color: '#2D8B5F', bg: 'rgba(45, 139, 95, 0.12)', border: 'rgba(45, 139, 95, 0.3)', icon: '▲', label: '积极看好' },
  negative: { color: '#C0392B', bg: 'rgba(192, 57, 43, 0.12)', border: 'rgba(192, 57, 43, 0.3)', icon: '▼', label: '担忧质疑' },
  neutral: { color: '#8B7355', bg: 'rgba(139, 115, 85, 0.12)', border: 'rgba(139, 115, 85, 0.3)', icon: '◆', label: '理性观察' }
}
