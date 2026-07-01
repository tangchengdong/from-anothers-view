# 换个视角看世界 — 后续迭代计划

> 生成日期：2026-06-30
> 当前状态：圆桌会并行化、Agent 内存预初始化、详情页默认角色、渐进式加载、黑屏修复 均已完成

---

## 一、本轮已完成（基线）

| 模块 | 优化点 | 文件 |
|------|--------|------|
| 圆桌会 | `/commentary/batch` 改为 `asyncio.gather` 并行请求，多角色评论不再串行等待 | `backend/app/routers/commentary.py` |
| 角色池 | 启动时 `init_agents_cache()` 预初始化全部 Agent 到内存，运行时直接命中缓存 | `backend/app/agents/__init__.py`、`backend/app/main.py` |
| 详情页 | 默认选中第一个角色并自动流式输出评论（修复闭包陈旧值 bug，引入 `contentRef`） | `src/pages/ContentDetail.jsx` |
| 加载体验 | 主内容就绪即关闭 loading，相关阅读后台异步加载；loading 文案改为渐进式提示 | `src/pages/ContentDetail.jsx` |
| 黑屏 | 详情页加入 `detail-fade-in` 渐入动画，消除跳转时的纯黑闪烁 | `src/pages/ContentDetail.css` |
| Agent 架构 | `base.py` + `dynamic_agent.py` 数据驱动单类设计已满足需求，无需拆分多 Agent 文件 | — |

---

## 二、下一阶段迭代项（按优先级排列）

### P0 — 性能与稳定性

1. **LLM 缓存命中率提升**
   - 当前缓存 key 基于 news_id + perspective，命中率有限
   - 增加「热点新闻预生成」：启动时对 Top 5 热点新闻 × 主力角色预生成短评，写入缓存
   - 文件：`backend/app/services/llm_service.py`、`backend/app/main.py`

2. **流式输出超时与降级链路加固**
   - 当前 SSE 流式 80s 超时后静默降级，用户无感知
   - 增加前端超时提示 + 一键重试按钮
   - 后端增加 stream 心跳事件（每 5s 发送 keep-alive），避免代理层断连
   - 文件：`backend/app/routers/commentary.py`、`src/api/content.js`

3. **Token 用量监控与熔断**
   - mimo 在线模型有 token 配额，当前仅靠 max_tokens 限制
   - 增加按日/按小时 token 计数，接近阈值时自动降级为模板 fallback
   - 文件：`backend/app/services/llm_service.py`

### P1 — 功能补全

4. **辩论室多轮交锋**
   - 当前每位辩手只发言一次
   - 支持 2-3 轮交锋：后发言者可引用/反驳前一位的观点
   - 后端新增 `/commentary/debate` 接口，传入历史发言上下文
   - 文件：`backend/app/routers/commentary.py`、`src/components/DebateRoom.jsx`

5. **茶话会主题聚合**
   - 当前茶话会按单条新闻展开
   - 增加按主题（如"AI""教育"）聚合多条相关新闻，角色跨新闻讨论
   - 文件：`src/components/TeaParty.jsx`、`backend/app/routers/feed.py`

6. **思维图谱动态数据接入**
   - 当前思维图谱为静态 6 节点
   - 将节点数据接入真实 LLM 生成的角色洞察维度（洞察力/共情力/批判力等可由 LLM 评分）
   - 文件：`src/pages/MindPalace.jsx`、`backend/app/routers/commentary.py`

7. **搜索功能 LLM 增强**
   - 搜索结果支持「任意话题」视角评论（当前 `generate_commentary` 仅模板生成）
   - 接入 LLM 对自定义搜索词生成多视角观点
   - 文件：`backend/app/routers/content.py`、`src/pages/SearchResults.jsx`

### P1 — 体验优化

8. **详情页报纸风格统一**
   - 当前详情页仍为深色赛博风（`#0a0a0f`）
   - 按项目约束向报纸米黄（`#F2EADF`）自然过渡，文字深色
   - 保留深色 Header 区域，正文区切换为纸质感
   - 文件：`src/pages/ContentDetail.css`

9. **圆桌会观点卡片骨架屏**
   - 并行请求期间展示骨架屏而非全屏 loading
   - 每个角色卡片独立 loading，谁先返回谁先展示
   - 文件：`src/components/PerspectiveComparison.jsx`

10. **移动端适配审计**
    - 抽卡弹窗、圆桌会、辩论室在窄屏下的布局检查
    - 触摸交互优化（悬停态改为长按或点击态）
    - 文件：各组件 CSS

### P2 — 架构演进

11. **Agent 记忆与成长系统**
    - 角色积累评论历史，形成「该角色的一贯立场」
    - 后续评论可引用自己过往观点，增强角色一致性
    - 文件：`backend/app/agents/dynamic_agent.py`、新增 `backend/app/services/agent_memory.py`

12. **多模型路由**
    - 短评用轻量模型（快、省 token），深度解读用更强模型
    - 支持配置多个模型，按 mode 路由
    - 文件：`backend/app/services/llm_service.py`、`.env`

13. **用户偏好学习**
    - 记录用户常选角色与阅读偏好
    - 推荐页优先展示偏好角色的视角
    - 文件：`backend/app/routers/user.py`、`src/store/useAppStore.js`

14. **WebSocket 实时辩论**
    - 辩论室从 HTTP 轮询/SSE 升级为 WebSocket
    - 支持实时多人围观 + 弹幕式反应
    - 文件：新增 `backend/app/routers/ws.py`

### P2 — 内容与数据

15. **RSS 源扩展与质量评分**
    - 扩展更多国内可访问的原生 RSS 源
    - 对每条资讯做质量评分（信源权威度、时效性、热度）
    - 文件：`backend/app/services/rss_service.py`

16. **资讯去重与聚类**
    - 同一事件多源报道自动聚类，圆桌会展示事件而非单条新闻
    - 文件：`backend/app/services/data_source.py`

---

## 三、技术债务

| 债务项 | 说明 | 建议 |
|--------|------|------|
| 首页大 chunk | `index-*.js` 559KB，超过 500KB 警告 | 路由级 code-split，MindPalace/DebateRoom 懒加载 |
| SSE 连接管理 | 前端 `streamRef` 关闭逻辑分散 | 封装 `useStream` hook 统一管理生命周期 |
| 角色池硬编码 | 45+ 角色写死在 `__init__.py` | 迁移到 JSON/YAML 配置文件，便于维护 |
| 错误处理不统一 | 各组件自行 try-catch，体验不一致 | 统一错误边界 + Toast 提示组件 |

---

## 四、验收标准（下一阶段）

- [ ] LLM 缓存命中率 > 60%（热点新闻预生成后）
- [ ] 详情页首屏 < 1.5s（渐进式加载后）
- [ ] 圆桌会 5 角色并行 < 8s（含 LLM 调用）
- [ ] 辩论室支持 2 轮交锋
- [ ] 详情页报纸风格过渡完成
- [ ] 移动端主流尺寸无布局错乱
