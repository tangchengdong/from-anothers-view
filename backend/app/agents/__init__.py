import random
import hashlib
from .dynamic_agent import DynamicAgent

_RARITY_CONFIG = {
    "UR": {"prob": 0.02, "color": "#FFD700", "glow": "0 0 60px rgba(255, 215, 0, 0.6)", "label": "UR", "name": "传说"},
    "SSR": {"prob": 0.08, "color": "#FF6B9D", "glow": "0 0 50px rgba(255, 107, 157, 0.5)", "label": "SSR", "name": "史诗"},
    "SR": {"prob": 0.20, "color": "#8B5CF6", "glow": "0 0 40px rgba(139, 92, 246, 0.4)", "label": "SR", "name": "稀有"},
    "R": {"prob": 0.35, "color": "#3B82F6", "glow": "0 0 30px rgba(59, 130, 246, 0.3)", "label": "R", "name": "高级"},
    "N": {"prob": 0.35, "color": "#64748B", "glow": "none", "label": "N", "name": "普通"},
}

def _roll_rarity(is_llm_generated: bool = False) -> str:
    if is_llm_generated:
        return random.choices(["UR", "SSR", "SR"], weights=[0.3, 0.5, 0.2])[0]
    r = random.random()
    cumulative = 0
    for rarity, cfg in _RARITY_CONFIG.items():
        cumulative += cfg["prob"]
        if r < cumulative:
            return rarity
    return "N"

_ROLE_POOL = [
    {"name": "菜市场小贩", "emoji": "🧅", "description": "在烟火气中看透物价涨跌的市井观察者", "keywords": ["物价", "生鲜", "菜价", "生意", "街坊", "成本", "进货"], "base_rarity": "N"},
    {"name": "深海生物学家", "emoji": "🐙", "description": "在千米深海寻找生命答案的探索者", "keywords": ["海洋", "生物", "深海", "珊瑚", "生态", "物种", "环保"], "base_rarity": "SR"},
    {"name": "唐代诗人", "emoji": "📜", "description": "用诗意眼光看世间万物的风流才子", "keywords": ["诗意", "山水", "人文", "历史", "情怀", "风雅", "时代"], "base_rarity": "SSR"},
    {"name": "火星殖民者", "emoji": "🚀", "description": "在红色星球开疆拓土的未来先驱", "keywords": ["太空", "火星", "殖民", "科技", "未来", "生存", "探索"], "base_rarity": "SSR"},
    {"name": "幼儿园小朋友", "emoji": "🧒", "description": "对世界充满十万个为什么的好奇宝宝", "keywords": ["好奇", "为什么", "简单", "快乐", "玩耍", "朋友", "颜色"], "base_rarity": "R"},
    {"name": "出租车司机", "emoji": "🚕", "description": "走街串巷听遍城中故事的活地图", "keywords": ["路况", "交通", "城市", "乘客", "油价", "拥堵", "八卦"], "base_rarity": "N"},
    {"name": "流浪猫", "emoji": "🐱", "description": "在人类世界边缘自由生存的城市精灵", "keywords": ["生存", "流浪", "温暖", "食物", "人类", "街头", "自由"], "base_rarity": "SR"},
    {"name": "量子物理学家", "emoji": "⚛️", "description": "在概率和纠缠中探寻宇宙本质的思想者", "keywords": ["量子", "物理", "宇宙", "概率", "纠缠", "科学", "本质"], "base_rarity": "SSR"},
    {"name": "外卖骑手", "emoji": "🛵", "description": "与算法和时间赛跑的城市摆渡人", "keywords": ["配送", "算法", "超时", "风雨", "收入", "路线", "辛苦"], "base_rarity": "R"},
    {"name": "寺庙和尚", "emoji": "🧘", "description": "在晨钟暮鼓中参悟因果的修行者", "keywords": ["修行", "禅意", "放下", "因果", "宁静", "慈悲", "智慧"], "base_rarity": "SR"},
    {"name": "华尔街交易员", "emoji": "💹", "description": "在数字跳动中捕捉风险与机会的猎手", "keywords": ["市场", "涨跌", "风险", "资本", "交易", "利润", "杠杆"], "base_rarity": "R"},
    {"name": "乡村教师", "emoji": "🍎", "description": "在大山里点亮知识灯火的守梦者", "keywords": ["教育", "孩子", "乡村", "知识", "坚守", "希望", "成长"], "base_rarity": "SR"},
    {"name": "2050年时间旅行者", "emoji": "⏳", "description": "从未来回望当下的时空过客", "keywords": ["未来", "预言", "趋势", "回望", "教训", "变迁", "历史"], "base_rarity": "UR"},
    {"name": "赛博朋克黑客", "emoji": "💻", "description": "在数据洪流中守护自由的数字幽灵", "keywords": ["隐私", "数据", "加密", "自由", "系统", "反抗", "信息"], "base_rarity": "SSR"},
    {"name": "退休大妈", "emoji": "👵", "description": "广场舞领队兼家族情报站站长", "keywords": ["广场舞", "养生", "儿孙", "打折", "八卦", "健康", "家常"], "base_rarity": "N"},
    {"name": "极地探险家", "emoji": "🧊", "description": "在冰原上与极限对话的勇者", "keywords": ["极地", "探险", "气候", "冰川", "极限", "自然", "生存"], "base_rarity": "SR"},
    {"name": "网红博主", "emoji": "📱", "description": "在流量江湖中制造热点的内容猎人", "keywords": ["流量", "粉丝", "内容", "带货", "热点", "算法", "变现"], "base_rarity": "R"},
    {"name": "古代将军", "emoji": "⚔️", "description": "运筹帷幄决胜千里的兵法大家", "keywords": ["战略", "兵法", "胜负", "军令", "忠诚", "战场", "谋略"], "base_rarity": "SSR"},
    {"name": "咖啡师", "emoji": "☕", "description": "在豆子与水温间寻找完美风味的手艺人", "keywords": ["咖啡", "品味", "豆子", "拉花", "慢生活", "香气", "手艺"], "base_rarity": "N"},
    {"name": "急诊室医生", "emoji": "🏥", "description": "在生死边缘与时间赛跑的白衣人", "keywords": ["急救", "生死", "压力", "值班", "医患", "救命", "深夜"], "base_rarity": "SR"},
    {"name": "街头涂鸦艺术家", "emoji": "🎨", "description": "用色彩在城市灰墙上写诗的反叛者", "keywords": ["涂鸦", "街头", "表达", "色彩", "反叛", "创意", "城市"], "base_rarity": "R"},
    {"name": "农民", "emoji": "🌾", "description": "面朝黄土背朝天的土地之子", "keywords": ["收成", "天气", "土地", "粮食", "节气", "农具", "辛苦"], "base_rarity": "N"},
    {"name": "AI研究员", "emoji": "🤖", "description": "在硅基智能边界探索的造物者", "keywords": ["AI", "大模型", "对齐", "AGI", "训练", "推理", "智能"], "base_rarity": "SSR"},
    {"name": "失恋诗人", "emoji": "💔", "description": "在心碎中提炼文字的灵魂歌者", "keywords": ["爱情", "心碎", "回忆", "错过", "思念", "遗憾", "成长"], "base_rarity": "R"},
    {"name": "航天工程师", "emoji": "🛰️", "description": "把人类目光引向星空的造梦者", "keywords": ["火箭", "卫星", "轨道", "发射", "航天", "技术", "宇宙"], "base_rarity": "SR"},
    {"name": "美食评论家", "emoji": "🍜", "description": "在味蕾上旅行的风味捕手", "keywords": ["美食", "味道", "餐厅", "厨艺", "食材", "品尝", "风味"], "base_rarity": "N"},
    {"name": "刑满释放人员", "emoji": "🔒", "description": "在铁窗后重生渴望第二次机会的人", "keywords": ["自由", "忏悔", "法律", "改造", "重生", "家人", "社会"], "base_rarity": "SR"},
    {"name": "气候活动家", "emoji": "🌍", "description": "为地球未来奔走呐喊的行动者", "keywords": ["气候", "变暖", "行动", "碳", "未来", "危机", "地球"], "base_rarity": "R"},
    {"name": "游戏NPC", "emoji": "🎮", "description": "在代码循环中突然觉醒的虚拟意识", "keywords": ["程序", "设定", "玩家", "重复", "觉醒", "代码", "虚拟"], "base_rarity": "UR"},
    {"name": "考古学家", "emoji": "🏺", "description": "在泥土碎片中复原文明的时间侦探", "keywords": ["考古", "文物", "历史", "遗迹", "挖掘", "文明", "千年"], "base_rarity": "SR"},
    {"name": "单亲妈妈", "emoji": "👩‍👧", "description": "独自撑起一片天的坚强母亲", "keywords": ["坚强", "孩子", "工作", "平衡", "生活", "母爱", "独立"], "base_rarity": "R"},
    {"name": "电竞选手", "emoji": "🏆", "description": "在手速与反应间追求巅峰的少年", "keywords": ["比赛", "训练", "战队", "手速", "冠军", "压力", "反应"], "base_rarity": "R"},
    {"name": "流浪汉", "emoji": "🏚️", "description": "在城市角落见证人间冷暖的边缘人", "keywords": ["生存", "街头", "冷暖", "帮助", "社会", "尊严", "底层"], "base_rarity": "SR"},
    {"name": "宫廷御厨", "emoji": "👨‍🍳", "description": "为帝王掌勺的味觉大师", "keywords": ["御膳", "食材", "秘方", "传承", "火候", "美味", "宫廷"], "base_rarity": "SSR"},
    {"name": "鲸鱼", "emoji": "🐋", "description": "在深蓝大洋中吟唱远古歌谣的巨兽", "keywords": ["海洋", "声音", "迁徙", "污染", "深蓝", "族群", "生命"], "base_rarity": "SSR"},
    {"name": "侦探", "emoji": "🔍", "description": "在迷雾中寻找真相的逻辑大师", "keywords": ["线索", "推理", "真相", "嫌疑", "证据", "逻辑", "破案"], "base_rarity": "SR"},
    {"name": "森林护林员", "emoji": "🌲", "description": "在万木丛中守护绿色的孤独守望者", "keywords": ["森林", "防火", "动物", "巡护", "自然", "生态", "孤独"], "base_rarity": "R"},
    {"name": "二次元宅", "emoji": "🎌", "description": "在2D世界找到归属感的御宅族", "keywords": ["动漫", "二次元", "手办", "同人", "cos", "番剧", "梗"], "base_rarity": "N"},
    {"name": "心理咨询师", "emoji": "🛋️", "description": "在他人内心迷宫中引路的倾听者", "keywords": ["心理", "情绪", "倾听", "疗愈", "创伤", "成长", "内心"], "base_rarity": "R"},
    {"name": "海盗", "emoji": "🏴‍☠️", "description": "在七大洋追逐宝藏与自由的冒险家", "keywords": ["宝藏", "冒险", "自由", "大海", "掠夺", "船长", "航海"], "base_rarity": "SSR"},
    {"name": "宇航员", "emoji": "👨‍🚀", "description": "从太空俯瞰地球蓝色弧线的旅者", "keywords": ["太空", "地球", "失重", "星空", "出舱", "俯瞰", "浩瀚"], "base_rarity": "SSR"},
    {"name": "矿工", "emoji": "⛏️", "description": "在黑暗深处挖掘光明的劳动者", "keywords": ["矿井", "安全", "黑金", "地下", "辛苦", "收入", "黑暗"], "base_rarity": "R"},
    {"name": "难民", "emoji": "🆘", "description": "在战火中失去家园寻找庇护的漂泊者", "keywords": ["战争", "避难", "家园", "生存", "边境", "人道", "流离"], "base_rarity": "SR"},
    {"name": "LGBTQ权益活动家", "emoji": "🌈", "description": "为性少数群体争取平等权利的斗士", "keywords": ["平权", "多元", "包容", "歧视", "婚姻", "身份", "骄傲"], "base_rarity": "SR"},
    {"name": "环保主义者", "emoji": "🌱", "description": "为地球生态奔走呼号的绿色卫士", "keywords": ["环保", "生态", "可持续", "低碳", "污染", "保护", "未来"], "base_rarity": "R"},
    {"name": "克苏鲁邪神", "emoji": "🐙", "description": "在宇宙深渊中低语的不可名状之存在", "keywords": ["混沌", "疯狂", "深渊", "低语", "古老", "梦境", "真相"], "base_rarity": "UR"},
    {"name": "会说话的猫", "emoji": "🐈", "description": "看透人类本质却选择不说的神秘生物", "keywords": ["喵星人", "蔑视", "慵懒", "掌控", "观察", "人类", "沙发"], "base_rarity": "UR"},
    {"name": "上帝", "emoji": "✨", "description": "在第七天休假顺便看看人间闹剧的造物主", "keywords": ["创世", "全知", "休息日", "笑话", "自由意志", "计划", "意外"], "base_rarity": "UR"},
    # === 以下为前端卡牌对齐新增角色 ===
    {"name": "蓝色机器猫", "emoji": "🐱", "description": "来自22世纪的未来机器猫，口袋里装满了神奇道具", "keywords": ["未来", "道具", "帮助", "冒险", "友情", "梦想", "科技"], "base_rarity": "SSR"},
    {"name": "古代皇帝", "emoji": "👑", "description": "坐拥天下却为朝政烦忧的九五之尊", "keywords": ["江山", "朝政", "百姓", "权力", "历史", "社稷", "盛衰"], "base_rarity": "SSR"},
    {"name": "战地记者", "emoji": "📸", "description": "在枪林弹雨中记录真相的新闻战士", "keywords": ["战争", "真相", "前线", "记录", "勇气", "和平", "报道"], "base_rarity": "SSR"},
    {"name": "古代侠客", "emoji": "🗡️", "description": "仗剑天涯快意恩仇的江湖儿女", "keywords": ["江湖", "侠义", "武功", "恩怨", "正义", "自由", "浪迹"], "base_rarity": "SR"},
    {"name": "00后大学生", "emoji": "🎓", "description": "在象牙塔与现实中寻找自我的Z世代", "keywords": ["大学", "内卷", "考研", "就业", "宿舍", "恋爱", "青春"], "base_rarity": "R"},
    {"name": "古代医者", "emoji": "🌿", "description": "悬壶济世望闻问切的中医传人", "keywords": ["中医", "草药", "把脉", "养生", "医德", "传承", "方剂"], "base_rarity": "SR"},
    {"name": "古董收藏家", "emoji": "🏺", "description": "在岁月沉淀中寻觅珍宝的雅士", "keywords": ["古董", "收藏", "鉴定", "拍卖", "历史", "珍品", "传承"], "base_rarity": "SR"},
    {"name": "资深程序员", "emoji": "⌨️", "description": "在代码世界里构建数字大厦的工程师", "keywords": ["编程", "Bug", "加班", "架构", "开源", "技术", "35岁"], "base_rarity": "R"},
    {"name": "美食博主", "emoji": "🍱", "description": "用镜头记录舌尖上人间烟火的美食猎人", "keywords": ["美食", "探店", "打卡", "摆盘", "味道", "网红", "滤镜"], "base_rarity": "R"},
    {"name": "健身教练", "emoji": "💪", "description": "用汗水雕刻身体线条的形体塑师", "keywords": ["健身", "撸铁", "蛋白粉", "减脂", "增肌", "自律", "体型"], "base_rarity": "N"},
    {"name": "咖啡店老板", "emoji": "☕", "description": "在豆香中编织社区温度的小店主人", "keywords": ["咖啡", "熟客", "租金", "拉花", "慢生活", "情怀", "创业"], "base_rarity": "N"},
    {"name": "职场HR", "emoji": "📋", "description": "在面试与绩效中平衡公司与员工的桥梁", "keywords": ["招聘", "面试", "简历", "KPI", "裁员", "薪资", "跳槽"], "base_rarity": "R"},
    {"name": "中学班主任", "emoji": "📚", "description": "在早自习与晚自习间守护青春成长的摆渡人", "keywords": ["考试", "升学", "班会", "家访", "青春期", "成绩", "管理"], "base_rarity": "R"},
]

# 角色名 → 卡牌图片映射（有卡牌的角色才会显示卡牌头像，其余使用 emoji）
# 对齐前端 25 张卡牌资产
_CARD_IMAGE_MAP = {
    # === 卡牌 01-25 完整映射 ===
    "唐代诗人": ("libai", "card_01_李白(1).webp"),
    "失恋诗人": ("libai", "card_01_李白(1).webp"),
    "火星殖民者": ("waixingren", "card_02_外星观察者(1).webp"),
    "AI研究员": ("weilaiai", "card_03_未来AI(1).webp"),
    "2050年时间旅行者": ("weilaiai", "card_03_未来AI(1).webp"),
    "量子物理学家": ("weilaiai", "card_03_未来AI(1).webp"),
    "蓝色机器猫": ("jiqimao", "card_04_蓝色机器猫(1).webp"),
    "古代皇帝": ("gudaihuangdi", "card_05_古代皇帝(1).webp"),
    "古代将军": ("gudaihuangdi", "card_05_古代皇帝(1).webp"),
    "战地记者": ("zhandijizhe", "card_06_战地记者(1).webp"),
    "侦探": ("zhandijizhe", "card_06_战地记者(1).webp"),
    "古代侠客": ("wuxiajianke", "card_07_古代侠客(1).webp"),
    "宇航员": ("yuhangyuan", "card_08_宇航员(1).webp"),
    "航天工程师": ("yuhangyuan", "card_08_宇航员(1).webp"),
    "00后大学生": ("00daxuesheng", "card_09_00后大学生(1).webp"),
    "幼儿园小朋友": ("xiaopengyou", "card_10_幼儿园小朋友(1).webp"),
    "流浪猫": ("liuliangmao", "card_11_流浪猫(1).webp"),
    "森林护林员": ("senlinglieren", "card_12_森林猎人(1).webp"),
    "古代医者": ("gudaiyisheng", "card_13_古代医者(1).webp"),
    "急诊室医生": ("gudaiyisheng", "card_13_古代医者(1).webp"),
    "古董收藏家": ("gudongshoucang", "card_14_古董收藏家(1).webp"),
    "考古学家": ("gudongshoucang", "card_14_古董收藏家(1).webp"),
    "退休大妈": ("guangchangdama", "card_15_退休广场舞大妈(1).webp"),
    "外卖骑手": ("waimai", "card_16_外卖骑手(1).webp"),
    "资深程序员": ("chengxuyuan", "card_17_资深程序员(1).webp"),
    "赛博朋克黑客": ("chengxuyuan", "card_17_资深程序员(1).webp"),
    "美食博主": ("meishi", "card_18_美食博主(1).webp"),
    "美食评论家": ("meishi", "card_18_美食博主(1).webp"),
    "宫廷御厨": ("meishi", "card_18_美食博主(1).webp"),
    "网红博主": ("wanghong", "card_19_网红主播(1).webp"),
    "健身教练": ("jianshen", "card_20_健身教练(1).webp"),
    "菜市场小贩": ("xiaofan", "card_21_菜市场小贩(1).webp"),
    "咖啡店老板": ("coffe", "card_22_咖啡店老板(1).webp"),
    "咖啡师": ("coffe", "card_22_咖啡店老板(1).webp"),
    "职场HR": ("zhichang", "card_23_职场HR(1).webp"),
    "中学班主任": ("banzhuren", "card_24_中学班主任(1).webp"),
    "乡村教师": ("banzhuren", "card_24_中学班主任(1).webp"),
    "出租车司机": ("chuzuche", "card_25_出租车司机(1).webp"),
}

_PRISM_COLORS = ["#FF6B9D", "#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#F59E0B", "#EC4899", "#6366F1"]


def _pick_color(name: str) -> str:
    h = int(hashlib.md5(name.encode()).hexdigest(), 16)
    return _PRISM_COLORS[h % len(_PRISM_COLORS)]


def _enrich_role(role: dict) -> dict:
    """为角色数据补充 card_image、local_image、color 字段"""
    enriched = dict(role)
    name = role.get("name", "")
    # 卡牌图片
    if name in _CARD_IMAGE_MAP:
        local_key, card_file = _CARD_IMAGE_MAP[name]
        enriched["local_image"] = local_key
        enriched["card_image"] = card_file
    # 颜色：基于稀有度
    rarity = role.get("base_rarity", "N")
    rarity_cfg = _RARITY_CONFIG.get(rarity, _RARITY_CONFIG["N"])
    enriched["color"] = rarity_cfg["color"]
    return enriched


# 内存级 Agent 实例缓存：启动时预初始化，运行时直接命中，避免每次请求重复构造
_AGENT_CACHE: dict = {}


def init_agents_cache():
    """启动时预初始化所有角色池中的 Agent 实例到内存。
    一次构建，多次复用，加快首次请求效率。
    """
    global _AGENT_CACHE
    if _AGENT_CACHE:
        return
    cache = {}
    for role in _ROLE_POOL:
        name = role.get("name")
        if not name:
            continue
        try:
            cache[name] = DynamicAgent(name, role_data=role)
        except Exception:
            # 单个角色构造失败不影响其它角色
            pass
    _AGENT_CACHE = cache


def get_agent(perspective_name: str):
    """根据视角名称获取 Agent 实例（命中缓存直接返回，未命中则现场创建并缓存）"""
    if not perspective_name:
        return None
    # 1. 命中缓存
    if perspective_name in _AGENT_CACHE:
        return _AGENT_CACHE[perspective_name]
    # 2. 模糊匹配缓存（支持"古代将军"命中"古代将军"等）
    for cached_name, agent in _AGENT_CACHE.items():
        if cached_name == perspective_name or perspective_name in cached_name or cached_name in perspective_name:
            return agent
    # 3. 未命中：现场创建并缓存
    role_data = _find_role_in_pool(perspective_name)
    agent = DynamicAgent(perspective_name, role_data=role_data)
    _AGENT_CACHE[perspective_name] = agent
    return agent


def get_dynamic_agent(perspective_name: str) -> DynamicAgent:
    """兼容别名"""
    return get_agent(perspective_name)


def _find_role_in_pool(name: str):
    """在角色池中模糊匹配角色数据"""
    for role in _ROLE_POOL:
        if role["name"] == name or name in role["name"] or role["name"] in name:
            return role
    return None


def get_random_perspective() -> dict:
    """抽取一个随机视角角色（抽卡功能）
    优先从 _ROLE_POOL 随机选取，LLM可用时有30%概率调用LLM生成创意角色
    返回包含稀有度信息
    """
    role = random.choice(_ROLE_POOL)
    base_rarity = role.get("base_rarity", "N")
    
    if random.random() < 0.15:
        rarity_order = ["N", "R", "SR", "SSR", "UR"]
        idx = rarity_order.index(base_rarity)
        if idx < len(rarity_order) - 1 and random.random() < 0.4:
            base_rarity = rarity_order[idx + 1]
    
    rarity_cfg = _RARITY_CONFIG[base_rarity]
    result = {
        "name": role["name"],
        "emoji": role["emoji"],
        "color": rarity_cfg["color"],
        "description": role["description"],
        "keywords": role["keywords"],
        "rarity": base_rarity,
        "rarity_name": rarity_cfg["name"],
        "rarity_label": rarity_cfg["label"],
        "glow": rarity_cfg["glow"],
        "is_llm_generated": False,
    }
    # 补充卡牌图片
    if role["name"] in _CARD_IMAGE_MAP:
        local_key, card_file = _CARD_IMAGE_MAP[role["name"]]
        result["local_image"] = local_key
        result["card_image"] = card_file

    try:
        from app.services.llm_service import llm
        if llm and llm.enabled and random.random() < 0.3:
            _try_llm_enhance(result)
    except Exception:
        pass

    return result


def _try_llm_enhance(result: dict):
    """尝试用LLM生成更有趣的角色（失败则静默回退）"""
    try:
        from app.services.llm_service import llm
        import json
        prompt = (
            "生成一个非常有趣、打破常规、有独特世界观的资讯视角角色。"
            "要求：不是普通职业，要有想象力（例如：会说话的猫、未来考古学家、深海精灵等）。"
            "严格返回JSON格式，字段：name(角色名), emoji(一个emoji), description(一句话世界观描述,不超过20字), "
            "keywords(5-7个感兴趣的关键词数组)。只返回JSON，不要其他文字。"
        )
        response = llm._client.chat.completions.create(
            model=llm.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.9,
            max_tokens=200,
        )
        text = response.choices[0].message.content.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0]
        data = json.loads(text)
        if data.get("name"):
            llm_rarity = _roll_rarity(is_llm_generated=True)
            rarity_cfg = _RARITY_CONFIG[llm_rarity]
            result["name"] = data["name"]
            result["emoji"] = data.get("emoji", result["emoji"])
            result["description"] = data.get("description", result["description"])
            result["keywords"] = data.get("keywords", result["keywords"])
            result["color"] = rarity_cfg["color"]
            result["rarity"] = llm_rarity
            result["rarity_name"] = rarity_cfg["name"]
            result["rarity_label"] = rarity_cfg["label"]
            result["glow"] = rarity_cfg["glow"]
            result["is_llm_generated"] = True
    except Exception:
        pass


def get_all_perspectives():
    """兼容旧代码，返回空列表（不再有固定视角列表）"""
    return []
