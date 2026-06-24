# 换个视角看世界

> AI 驱动的跨圈层资讯破茧器 —— 打破算法茧房，看见不同人群眼中的真实世界。

我们称用户为**破茧者**。产品通过 12 种棱镜视角解读同一资讯，并结合用户画像反向过滤，主动屏蔽与你高度同质化的内容，让你真正看见"另一个世界"。

## 产品特色

- **破茧者定位**：不是给你想看的，而是给你"应该看见的"
- **12 棱镜视角**（6 常规 + 6 特色）：
  - 常规：她视角 / Z世代 / 父母辈 / 创作者 / 科技控 / 生活家
  - 特色 ✨：酷儿视角 / 环保视角 / 无障碍视角 / 乡村视角 / 银发视角 / 国际视角
- **用户画像反向过滤**：填写年龄/性别/职业/地域/兴趣后，系统识别你的圈层，主动屏蔽与你相关度 > 70% 的同质化内容，真正打破信息茧房
- **SSE 流式体验**：资讯逐条推送，配合思考过程与破茧进度条
- **动态自定义视角**：搜索时可即时添加任意视角（如"投资者""医生""历史学者"），系统动态生成该视角解读
- **暗色棱镜主题**：粉→紫→蓝→青渐变，无黑字配暗色背景，移动端响应式

## 技术栈

**前端**：React 18 + Vite 5 + zustand（状态持久化）+ react-router-dom 6 + 纯 CSS（无第三方 UI 库）

**后端**：FastAPI + httpx + feedparser + JWT + bcrypt + SSE（sse-starlette）

**LLM**：OpenAI 兼容接口（支持 DeepSeek / 智谱 / OpenAI），无 API key 时自动降级到规则模板

**数据源**：三级优先级合并 —— RSS 实时缓存 > 本地爬取数据 > mock 兜底，带去重

## 快速开始

### 环境要求

- Node.js >= 18
- Python >= 3.10
- npm 或 pnpm

### 安装步骤

1. **克隆项目**

```bash
git clone <repo-url>
cd from_anothers_view
```

2. **安装前端依赖**

```bash
npm install
```

3. **安装后端依赖**

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

4. **配置环境变量**

```bash
# 复制示例配置（后端目录下）
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
```

编辑 `.env`，可选填 LLM_API_KEY（不填则走规则模板降级模式）：

```
LLM_API_KEY=                 # 可选，留空则降级
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
JWT_SECRET=dev-secret-key-change-me
FRONTEND_URL=http://localhost:3000
PORT=8000
```

5. **一键启动**

```bash
# 回到项目根目录
cd ..
# Windows 双击 start.bat 或运行
start.bat
```

启动后：
- 前端：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

## 项目结构

```
from_anothers_view/
├── src/                          # 前端
│   ├── api/                      # axios 封装 + 接口
│   ├── components/               # 10+ 组件（Header/Hero/StreamFeed/PerspectiveSection 等）
│   ├── pages/                    # 6 页面（Home/Login/Register/SearchResults/Profile/ContentDetail）
│   ├── store/                    # zustand 状态（useUserStore/useAppStore/useFeedStore）
│   └── App.jsx                   # 路由配置
├── backend/
│   ├── app/
│   │   ├── routers/              # 5 路由（auth/feed/content/perspectives/user）
│   │   ├── services/             # 7 服务（auth/feed/data_source/llm/rss/search/profile）
│   │   ├── agents/               # 12 视角 Agent + DynamicAgent + base
│   │   ├── data/                 # local_news.json / rss_feeds.py / users.json
│   │   ├── config.py             # 统一配置
│   │   └── main.py               # FastAPI 入口
│   └── requirements.txt
├── crawl_news.py                 # 本地数据爬取脚本
├── start.bat                     # 一键启动
└── .env.example
```

## API 文档摘要

启动后访问 http://localhost:8000/docs 查看完整 Swagger 文档。

| 模块 | 端点 | 说明 |
|---|---|---|
| auth | POST /api/auth/register | 注册 |
| auth | POST /api/auth/login | 登录（返回 JWT） |
| auth | GET /api/auth/me | 当前用户信息 |
| feed | GET /api/feed | 资讯流（含画像反向过滤） |
| feed | GET /api/feed/stream | SSE 流式资讯 |
| feed | GET /api/feed/ranking | 12 视角排行榜 |
| content | GET /api/content/search | 搜索（支持自定义视角） |
| content | GET /api/content/{id} | 资讯详情 |
| perspectives | GET /api/perspectives | 12 视角列表 |
| user | GET /api/user/profile | 用户画像 |
| user | POST /api/user/profile | 更新画像 |
| user | GET /api/user/circles | 识别圈层 |
| user | POST /api/user/favorites/{id} | 收藏切换 |
| user | POST /api/user/likes/{id} | 点赞切换 |

## 测试账号

```
用户名：test
密码：test123456
```

登录后可在"个人中心"填写画像（如 30 岁男性程序员），体验反向过滤效果。

## 数据源说明

**三级数据优先级**（带去重）：

1. **RSS 实时缓存**（10 分钟内存缓存）：18 个原生 RSS 源，覆盖科技/国际/健康/教育/环保等视角
2. **本地爬取数据**（local_news.json，474 条）：由 `crawl_news.py` 抓取 RSS + 12 视角专题编辑数据合并生成
3. **mock 兜底数据**：前两级都失败时的兜底

**RSS 源覆盖**：
- 科技：IT之家 / 36氪 / 少数派 / 阮一峰 / Solidot / 科学网 / Hacker News / TechCrunch / The Verge / Engadget
- 国际：中国日报 / 联合早报 / 人民网-国际
- 父母辈：人民网-健康 / 人民网-教育 / 新华网-时政
- 环保：人民网-环保
- 综合：人民网-社会（按关键词自动分类到各视角）

仅使用国内可访问的原生 RSS 源（排除 feedx.net / rsshub.app）。

## 重新爬取本地数据

```bash
cd backend
venv\Scripts\python.exe ..\crawl_news.py
```

## License

MIT
