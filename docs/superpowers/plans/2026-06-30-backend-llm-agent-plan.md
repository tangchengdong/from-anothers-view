# 后端开发与智能体接入规划（修订版）

> **目标**：直接使用 mimo 线上模型，为前端新增功能匹配后端 API

**架构**：FastAPI + mimo-v2.5（OpenAI 兼容接口）+ 现有智能体框架

**约束**：mimo 为线上模型，注意 token 用量，避免大规模调用

---

## 一、现状分析

### 1.1 LLM 配置

已在 `.env` 中配置 mimo 模型：
```
LLM_API_KEY=tp-cvb7124japv7i9foduz7kccfvoc6c6icev6k3kegq9ffzhff
LLM_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1
LLM_MODEL=mimo-v2.5
```

[llm_service.py](file:///g:/code/from_anothers_view/backend/app/services/llm_service.py) 已接入 mimo，带缓存机制控制 token 用量。

### 1.2 前端 Mock → API 缺口分析

| Mock 函数 | 使用组件 | 后端 API 状态 | 需要新增？ |
|---|---|---|---|
| `generateOpinion(role, news)` | TeaPartyChat, ContentDetail, SearchResults | 无 | **是** |
| `generateDeepOpinionByStyle(role, news, short)` | ContentDetail | 无 | **是** |
| `getMultiPerspectiveNews(persps, n)` | PrismRoundtable, HotNewsRanking, PerspectiveComparison | 无 | **是** |
| `getHotNewsRanking(n)` | DebateRoom, PrismRoundtable, HotNewsRanking | `GET /api/feed` 存在但接口不同 | **是** |
| `getSuggestedPerspectives(n)` | DebateRoom, PerspectivePicker, SearchResults | `GET /api/perspectives/suggest` 已有但未接入 | 前端接入 |
| `getSearchResults(q, persp, n)` | SearchResults | `GET /api/content/search` 已有但未接入 | 前端接入 |
| `getRandomPerspective()` | PerspectivePicker | `GET /api/perspectives/draw` 已有但未接入 | 前端接入 |
| `getMockContentDetail(id)` | ContentDetail | `GET /api/content/{id}` 已有，fallback 到 mock | 前端优化 |
| `getMockRelatedContent(id)` | ContentDetail | `GET /api/content/related/{id}` 已有但未接入 | 前端接入 |
| `MOCK_ROLES` 常量 | ContentDetail, PrismRoundtable, HotNewsRanking | `GET /api/perspectives` 应替换 | 前端接入 |

---

## 二、后端开发规划

### 阶段一：核心 API 补全（优先）

**目标**：为前端现有 mock 功能提供真实后端接口，使用 mimo 生成评论

**工作量估计**：2-3 天

#### 任务 1.1：单视角评论生成 API

**文件**：[backend/app/routers/commentary.py](file:///g:/code/from_anothers_view/backend/app/routers/commentary.py)（已完成）

**端点**：
```
GET /api/commentary/generate?news_id={id}&perspective={视角名}
```

**返回**：
```json
{
  "news_id": 1575070,
  "perspective": "AI研究员",
  "commentary": "从AI研究员的视角看...",
  "model": "mimo-v2.5",
  "is_llm_generated": true
}
```

**状态**：✅ 已完成，已测试通过

---

#### 任务 1.2：深度评论生成 API

**文件**：[backend/app/routers/commentary.py](file:///g:/code/from_anothers_view/backend/app/routers/commentary.py)

**新增端点**：
```
GET /api/commentary/deep?news_id={id}&perspective={视角名}
```

**功能**：
- 生成更长篇的深度评论（200-300字）
- 替代前端 `generateDeepOpinionByStyle`
- 使用缓存控制 token 用量

**返回**：
```json
{
  "news_id": 1575070,
  "perspective": "AI研究员",
  "short_commentary": "简短评论...",
  "deep_commentary": "深度分析...",
  "model": "mimo-v2.5",
  "is_llm_generated": true
}
```

**工作量**：0.5 天

---

#### 任务 1.3：多视角批量评论 API

**文件**：`backend/app/routers/commentary.py`

**新增端点**：
```
POST /api/commentary/batch
Body: { "news_id": 123, "perspectives": ["AI研究员", "科技控", "创作者"] }
```

**功能**：
- 为一条新闻批量生成多个视角的评论
- 替代前端 `getMultiPerspectiveNews` 的核心逻辑
- 内部调用 `generate_insight`，利用缓存避免重复调用

**返回**：
```json
{
  "news_id": 123,
  "news_title": "...",
  "opinions": {
    "AI研究员": "从AI角度看...",
    "科技控": "作为科技爱好者...",
    "创作者": "从创作视角..."
  },
  "model": "mimo-v2.5"
}
```

**工作量**：0.5 天

---

#### 任务 1.4：热点新闻 API

**文件**：`backend/app/routers/feed.py`

**新增端点**：
```
GET /api/feed/hot?limit=8
```

**功能**：
- 返回按热度排序的新闻列表
- 替代前端 `getHotNewsRanking`
- 数据来源：`data_source.get_all_news()`，按 views 排序

**返回**：
```json
{
  "items": [
    { "id": 123, "title": "...", "source": "...", "views": 1234567, "hot": true, "summary": "..." }
  ],
  "total": 8
}
```

**工作量**：0.5 天

---

#### 任务 1.5：前端 API 接入

**文件**：`src/api/content.js`（新增函数）

**新增 API 函数**：
```javascript
// 热点新闻
export function getHotNews(limit = 8) {
  return request.get('/feed/hot', { params: { limit } })
}

// 单视角评论
export function getCommentary(newsId, perspective) {
  return request.get('/commentary/generate', { params: { news_id: newsId, perspective } })
}

// 深度评论
export function getDeepCommentary(newsId, perspective) {
  return request.get('/commentary/deep', { params: { news_id: newsId, perspective } })
}

// 批量多视角评论
export function getBatchCommentary(newsId, perspectives) {
  return request.post('/commentary/batch', { news_id: newsId, perspectives })
}
```

**工作量**：0.5 天

---

#### 任务 1.6：前端组件接入

需要修改的组件（将 mock 调用替换为 API 调用）：

| 组件 | 修改内容 | 优先级 |
|------|----------|--------|
| `ContentDetail.jsx` | `generateOpinion` → `getCommentary` API | ⭐⭐⭐⭐⭐ |
| `ContentDetail.jsx` | `generateDeepOpinionByStyle` → `getDeepCommentary` API | ⭐⭐⭐⭐ |
| `TeaPartyChat.jsx` | `generateOpinion` → `getCommentary` API | ⭐⭐⭐⭐ |
| `PrismRoundtable.jsx` | `getMultiPerspectiveNews` → `getBatchCommentary` API | ⭐⭐⭐ |
| `HotNewsRanking.jsx` | `getHotNewsRanking` → `getHotNews` API | ⭐⭐⭐ |
| `DebateRoom.jsx` | `getHotNewsRanking` → `getHotNews` API | ⭐⭐⭐ |
| `SearchResults.jsx` | `getSearchResults` → `searchContent` API | ⭐⭐ |
| `PerspectivePicker.jsx` | `getSuggestedPerspectives` → `suggestPerspectives` API | ⭐⭐ |

**工作量**：1-1.5 天

---

### 阶段二：智能体增强（核心）

**目标**：优化智能体框架，支持流式输出和更好的 LLM 集成

**工作量估计**：2-3 天

#### 任务 2.1：流式输出支持

**文件**：[backend/app/services/llm_service.py](file:///g:/code/from_anothers_view/backend/app/services/llm_service.py)

**新增方法**：
```python
async def generate_stream(self, messages: List[Dict], **kwargs) -> AsyncGenerator[str, None]:
    """流式生成（SSE）"""
    client = self._get_client()
    async with client.stream(
        "POST",
        f"{self.base_url}/chat/completions",
        headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
        json={"model": self.model, "messages": messages, "stream": True, **kwargs},
    ) as response:
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                data = line[6:]
                if data == "[DONE]": break
                chunk = json.loads(data)
                content = chunk["choices"][0]["delta"].get("content", "")
                if content: yield content
```

**工作量**：0.5 天

#### 任务 2.2：流式评论端点

**文件**：`backend/app/routers/commentary.py`

**新增端点**：
```
GET /api/commentary/stream?news_id={id}&perspective={视角名}
```

**功能**：SSE 流式返回评论生成过程，前端可实时展示"思考中"效果

**工作量**：0.5 天

#### 任务 2.3：统一智能体接口

**文件**：[backend/app/agents/base.py](file:///g:/code/from_anothers_view/backend/app/agents/base.py)

**改动**：
- 统一 AgentContext 上下文
- 支持会话记忆（短期）
- 与 LLM 服务更好集成

**工作量**：1 天

#### 任务 2.4：前端流式接入

**改动**：
- ContentDetail 使用 EventSource 接收流式评论
- 展示"思考中"动画效果

**工作量**：0.5-1 天

---

### 阶段三：智能体协作（进阶）

**目标**：多视角讨论、视角碰撞等高级功能

**工作量估计**：3-5 天（可选）

#### 任务 3.1：讨论协调器

多视角围绕一个话题轮流讨论，生成讨论总结。

**工作量**：1.5 天

#### 任务 3.2：视角碰撞 API

`POST /api/discussion/start` 发起多视角讨论

**工作量**：1 天

#### 任务 3.3：前端茶话会/辩论厅接入

将 TeaPartyChat 和 DebateRoom 从 mock 改为调用真实 API。

**工作量**：1-2 天

---

## 三、工作量总结

| 阶段 | 任务 | 工作量 | 优先级 |
|------|------|--------|--------|
| **一** | **核心 API 补全** | **2-3 天** | ⭐⭐⭐⭐⭐ |
| | 1.1 单视角评论 API | ✅ 已完成 | |
| | 1.2 深度评论 API | 0.5 天 | ⭐⭐⭐⭐ |
| | 1.3 多视角批量评论 API | 0.5 天 | ⭐⭐⭐⭐ |
| | 1.4 热点新闻 API | 0.5 天 | ⭐⭐⭐ |
| | 1.5 前端 API 函数 | 0.5 天 | ⭐⭐⭐⭐ |
| | 1.6 前端组件接入 | 1-1.5 天 | ⭐⭐⭐⭐⭐ |
| **二** | **智能体增强** | **2-3 天** | ⭐⭐⭐⭐ |
| | 2.1 流式输出支持 | 0.5 天 | ⭐⭐⭐⭐ |
| | 2.2 流式评论端点 | 0.5 天 | ⭐⭐⭐ |
| | 2.3 统一智能体接口 | 1 天 | ⭐⭐⭐ |
| | 2.4 前端流式接入 | 0.5-1 天 | ⭐⭐⭐ |
| **三** | **智能体协作** | **3-5 天** | ⭐⭐ |
| | 3.1 讨论协调器 | 1.5 天 | ⭐⭐ |
| | 3.2 视角碰撞 API | 1 天 | ⭐⭐ |
| | 3.3 前端茶话会/辩论接入 | 1-2 天 | ⭐⭐ |

**总工作量估计**：
- **最小可用**（阶段一）：2-3 天
- **核心功能**（阶段一+二）：4-6 天
- **完整功能**（所有阶段）：7-11 天

---

## 四、Token 用量控制策略

由于 mimo 为线上付费模型，必须严格控制 token 用量：

### 4.1 缓存机制
- 相同新闻+视角的评论结果缓存 1 小时（已在 `llm_service.py` 实现）
- 批量评论接口复用单条缓存

### 4.2 调用限制
- `max_tokens` 限制：短评论 120，深度评论 300
- 批量接口单次最多 5 个视角
- 前端组件懒加载：只在用户展开/点击时才调用 LLM

### 4.3 降级策略
- LLM 调用失败时自动降级到模板（已有）
- 评论生成超时（15s）自动降级
- 缓存优先，减少实际 API 调用次数

---

## 五、快速开始

### 5.1 当前已可用

```bash
# 后端已启动，测试评论 API
curl http://localhost:8000/api/commentary/generate?news_id=1575070&perspective=AI研究员

# 查看服务状态
curl http://localhost:8000/api/commentary/status
```

### 5.2 下一步实施顺序

1. **任务 1.2**：深度评论 API → 0.5 天
2. **任务 1.3**：批量评论 API → 0.5 天
3. **任务 1.4**：热点新闻 API → 0.5 天
4. **任务 1.5-1.6**：前端接入 → 1-1.5 天

---

**文档版本**：v2.0（修订版）
**创建日期**：2026-06-30
**修订日期**：2026-06-30
**修订说明**：移除 Ollama 本地模型方案，改为直接使用 mimo 线上模型；新增前端接口缺口分析
