"""
RSS 订阅源配置
参考 https://github.com/AboutRSS/ALL-about-RSS 收录的资讯源
仅保留实测可用的原生 RSS 源（不依赖 rsshub.app / feedx.net）
按 12 个视角分类：6 常规 + 6 特色
"""

RSS_FEEDS = [
    # ===== 科技控视角 =====
    {
        "name": "IT之家",
        "url": "https://www.ithome.com/rss/",
        "category": "创新产品",
        "perspective": "tech",
        "tags": ["科技", "数码", "资讯"],
    },
    {
        "name": "36氪",
        "url": "https://36kr.com/feed",
        "category": "行业动态",
        "perspective": "tech",
        "tags": ["科技", "创业", "商业"],
    },
    {
        "name": "少数派",
        "url": "https://sspai.com/feed",
        "category": "创新产品",
        "perspective": "tech",
        "tags": ["数码", "效率", "科技"],
    },
    {
        "name": "阮一峰博客",
        "url": "http://www.ruanyifeng.com/blog/atom.xml",
        "category": "开发工具",
        "perspective": "tech",
        "tags": ["技术", "博客", "思考"],
    },
    {
        "name": "Solidot",
        "url": "https://www.solidot.org/index.rss",
        "category": "AI技术",
        "perspective": "tech",
        "tags": ["科技", "科学", "奇客"],
    },
    {
        "name": "科学网",
        "url": "https://www.sciencenet.cn/xml/blog.aspx?di=30",
        "category": "行业动态",
        "perspective": "tech",
        "tags": ["科学", "研究", "学术"],
    },
    {
        "name": "Hacker News",
        "url": "https://hnrss.org/frontpage",
        "category": "开发工具",
        "perspective": "tech",
        "tags": ["技术", "创业", "编程"],
    },
    {
        "name": "TechCrunch",
        "url": "https://techcrunch.com/feed/",
        "category": "科技创业",
        "perspective": "tech",
        "tags": ["科技", "创业", "融资"],
    },
    {
        "name": "The Verge",
        "url": "https://www.theverge.com/rss/index.xml",
        "category": "创新产品",
        "perspective": "tech",
        "tags": ["科技", "数码", "评测"],
    },
    {
        "name": "Engadget",
        "url": "https://www.engadget.com/rss.xml",
        "category": "创新产品",
        "perspective": "tech",
        "tags": ["科技", "数码", "消费电子"],
    },
    # ===== 国际视角 =====
    {
        "name": "中国日报",
        "url": "http://www.chinadaily.com.cn/rss/china_rss.xml",
        "category": "地缘政治",
        "perspective": "global",
        "tags": ["国际", "外交", "中国"],
    },
    {
        "name": "联合早报",
        "url": "http://www.zaobao.com/rss/znews.xml",
        "category": "跨文化交流",
        "perspective": "global",
        "tags": ["国际", "海外", "华人"],
    },
    {
        "name": "人民网-国际",
        "url": "https://www.people.com.cn/rss/world.xml",
        "category": "地缘政治",
        "perspective": "global",
        "tags": ["国际", "外交", "全球"],
    },
    # ===== 父母辈视角 =====
    {
        "name": "人民网-健康",
        "url": "https://www.people.com.cn/rss/health.xml",
        "category": "健康养生",
        "perspective": "parent",
        "tags": ["健康", "养生", "医疗"],
    },
    {
        "name": "人民网-教育",
        "url": "https://www.people.com.cn/rss/edu.xml",
        "category": "子女教育",
        "perspective": "parent",
        "tags": ["教育", "高考", "学校"],
    },
    {
        "name": "新华网-时政",
        "url": "http://www.xinhuanet.com/politics/news_politics.xml",
        "category": "家庭关系",
        "perspective": "parent",
        "tags": ["政策", "民生", "社保"],
    },
    # ===== 环保视角 =====
    {
        "name": "人民网-环保",
        "url": "https://www.people.com.cn/rss/env.xml",
        "category": "生态保护",
        "perspective": "environment",
        "tags": ["环保", "生态", "绿色"],
    },
    # ===== 综合资讯（通过关键词自动分类到各视角） =====
    {
        "name": "人民网-社会",
        "url": "https://www.people.com.cn/rss/society.xml",
        "category": "社会热点",
        "perspective": "tech",
        "tags": ["社会", "民生", "热点"],
    },
]

# 视角到 RSS 源的映射（用于本地爬取时分配视角）
# 科技类源以 tech 为主，其他视角通过关键词分类 + 专题编辑数据补充
PERSPECTIVE_FEED_MAP = {
    "tech": ["IT之家", "36氪", "少数派", "阮一峰博客", "Solidot", "科学网",
             "Hacker News", "TechCrunch", "The Verge", "Engadget", "人民网-社会"],
    "global": ["中国日报", "联合早报", "人民网-国际"],
    "parent": ["人民网-健康", "人民网-教育", "新华网-时政"],
    "environment": ["人民网-环保"],
}
