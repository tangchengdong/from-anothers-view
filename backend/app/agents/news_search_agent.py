"""
新闻搜索 Agent（自主搜索版）
- 不只从缓存池里选，而是自主调用搜索工具获取新数据
- 工具1: rss_realtime_search() — 实时 RSS 抓取（不依赖缓存）
- 工具2: analyze_trends() — LLM 分析当前热点，生成搜索策略
- 工具3: local_search() — 搜索已缓存新闻池
- Agent 自主决定搜索策略、调用工具、筛选标注
"""
import asyncio
import time
import hashlib
import logging
from typing import List, Dict, Any, Optional, AsyncIterator
from datetime import datetime

from .base import BaseAgent
from .dynamic_agent import DynamicAgent

logger = logging.getLogger(__name__)


# ============ 搜索工具定义 ============

class SearchTool:
    """搜索工具基类"""
    name: str = ""
    description: str = ""

    async def execute(self, query: str, limit: int = 10) -> List[Dict]:
        raise NotImplementedError


class RSSRealtimeTool(SearchTool):
    """实时 RSS 抓取工具 — 直接从 RSS 源拉取最新数据，不依赖缓存"""
    name = "rss_realtime"
    description = "实时从 RSS 源抓取最新新闻，支持按关键词搜索"

    async def execute(self, query: str = "", limit: int = 15) -> List[Dict]:
        from app.services.rss_feeds import RSS_FEEDS
        import httpx
        import feedparser
        import re

        all_items = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
            for feed_cfg in RSS_FEEDS[:10]:  # 取前10个源
                try:
                    resp = await client.get(feed_cfg["url"], timeout=8.0)
                    resp.raise_for_status()
                    parsed = feedparser.parse(resp.content)
                    for entry in parsed.entries[:10]:
                        title = entry.get("title", "").strip()
                        if not title:
                            continue
                        summary = re.sub(r"<[^>]+>", "", entry.get("summary", "") or "")
                        content = re.sub(r"<[^>]+>", "", str(entry.get("content", [{}]) and entry.get("content", [{}])[0].get("value", "")))

                        # 解析日期
                        pub_date = ""
                        for field in ["published_parsed", "updated_parsed"]:
                            t = entry.get(field)
                            if t:
                                try:
                                    pub_date = datetime(*t[:6]).strftime("%Y-%m-%d")
                                except Exception:
                                    pass
                        if not pub_date:
                            pub_date = datetime.now().strftime("%Y-%m-%d")

                        # 生成稳定 ID
                        key = entry.get("link", "") or title
                        item_id = int(hashlib.md5(key.encode()).hexdigest()[:8], 16) % 9000000 + 100000

                        item = {
                            "id": item_id,
                            "title": title,
                            "summary": summary[:120] if summary else title,
                            "content": content[:500] if content else summary[:500],
                            "source": feed_cfg["name"],
                            "category": feed_cfg.get("category", "综合"),
                            "tags": feed_cfg.get("tags", [])[:3],
                            "publish_time": pub_date,
                            "views": 0,
                            "image_url": "",
                            "link": entry.get("link", ""),
                            "is_rss": True,
                            "_tool": "rss_realtime",
                        }
                        all_items.append(item)
                except httpx.TimeoutException:
                    logger.warning("RSS 源超时: %s (%s)", feed_cfg["name"], feed_cfg["url"])
                except httpx.HTTPStatusError as e:
                    logger.warning("RSS 源 HTTP 错误: %s - %s", feed_cfg["name"], e.response.status_code)
                except Exception as e:
                    logger.warning("RSS 源抓取失败: %s - %s: %s", feed_cfg["name"], type(e).__name__, e)

        # 如果有 query，过滤
        if query:
            query_lower = query.lower()
            all_items = [
                n for n in all_items
                if query_lower in (n.get("title", "") + n.get("summary", "")).lower()
            ]

        all_items.sort(key=lambda x: x.get("publish_time", ""), reverse=True)
        return all_items[:limit]


class LocalSearchTool(SearchTool):
    """搜索已缓存的新闻池"""
    name = "local_search"
    description = "从已缓存的新闻池（RSS+MCP+本地）中搜索"

    async def execute(self, query: str = "", limit: int = 15) -> List[Dict]:
        from app.services.data_source import get_all_news

        pool = get_all_news()
        if not query:
            return pool[:limit]

        query_lower = query.lower()
        results = [
            n for n in pool
            if query_lower in (n.get("title", "") + n.get("summary", "") + n.get("content", "")).lower()
        ]
        results.sort(key=lambda x: x.get("publish_time", ""), reverse=True)
        return results[:limit]


class TrendsAnalysisTool(SearchTool):
    """LLM 分析当前热点 — 让 Agent 自主决定搜索什么"""
    name = "analyze_trends"
    description = "让 LLM 分析角色兴趣，生成应该搜索的关键词和策略"

    async def execute(self, query: str = "", limit: int = 10) -> List[Dict]:
        """返回 LLM 生成的搜索建议（关键词、分类、原因）"""
        try:
            from app.services.llm_service import llm
            if not llm or not llm.enabled:
                return self._default_suggestions()

            prompt = (
                "你是一个新闻搜索策略师。根据以下信息生成 3-5 个搜索关键词。\n\n"
                f"角色/场景：{query or '综合热点'}\n\n"
                "请返回 JSON 格式（不要有 markdown 包裹）：\n"
                '{"keywords": ["关键词1", "关键词2", ...], '
                '"reason": "选择这些关键词的原因"}'
            )
            result = await llm._generate_simple(prompt, max_tokens=120)
            if result:
                import json
                # 尝试解析 JSON
                result = result.strip()
                if result.startswith("```"):
                    result = result.split("\n", 1)[1].rsplit("```", 1)[0]
                data = json.loads(result)
                keywords = data.get("keywords", [])
                return [
                    {"keyword": kw, "reason": data.get("reason", ""), "_tool": "analyze_trends"}
                    for kw in keywords[:5]
                ]
        except Exception:
            pass
        return self._default_suggestions()

    def _default_suggestions(self) -> List[Dict]:
        """默认搜索建议"""
        return [
            {"keyword": "科技", "reason": "科技是热点领域", "_tool": "analyze_trends"},
            {"keyword": "社会", "reason": "社会话题关注度高", "_tool": "analyze_trends"},
            {"keyword": "经济", "reason": "经济形势受关注", "_tool": "analyze_trends"},
        ]


# ============ 工具注册表 ============

TOOLS = {
    "rss_realtime": RSSRealtimeTool(),
    "local_search": LocalSearchTool(),
    "analyze_trends": TrendsAnalysisTool(),
}


# ============ 主 Agent ============

class NewsSearchAgent:
    """自主新闻搜索 Agent

    工作流程：
    1. 用 analyze_trends 工具让 LLM 生成搜索策略
    2. 用 rss_realtime 工具实时抓取 RSS 新闻
    3. 用 local_search 工具搜索缓存池
    4. 合并去重 + 按角色筛选标注
    5. 存入新闻池供其他模块使用
    """

    def __init__(self, perspective_name: str, role_data: Optional[Dict] = None):
        self.perspective_name = perspective_name
        self.perspective_agent: BaseAgent = DynamicAgent(perspective_name, role_data=role_data)
        self.interest_keywords: List[str] = list(self.perspective_agent.interest_keywords)
        self.preferred_categories: List[str] = list(self.perspective_agent.preferred_categories)

    # ============ 核心：自主搜索 ============

    async def autonomous_search(
        self,
        keywords: Optional[List[str]] = None,
        limit: int = 10,
        use_llm_strategy: bool = True,
        use_llm_annotate: bool = True,
    ) -> Dict[str, Any]:
        """自主搜索新闻

        如果不提供 keywords，Agent 会用 LLM 自主决定搜什么。
        """
        # 第 1 步：生成搜索策略（如果没给 keywords）
        search_queries = keywords or []
        strategy_reason = ""

        if not search_queries and use_llm_strategy:
            # 调用 analyze_trends 工具
            trends = await TOOLS["analyze_trends"].execute(
                query=self.perspective_name, limit=5
            )
            search_queries = [t["keyword"] for t in trends if t.get("keyword")]
            reasons = [t.get("reason", "") for t in trends if t.get("reason")]
            strategy_reason = reasons[0] if reasons else ""

        if not search_queries:
            search_queries = self.interest_keywords[:3]

        # 第 2 步：多工具并行搜索
        all_found = []

        # 工具 A: 实时 RSS 抓取（每个关键词）
        rss_tasks = [
            TOOLS["rss_realtime"].execute(query=kw, limit=10)
            for kw in search_queries[:3]
        ]
        # 工具 B: 缓存池搜索
        local_tasks = [
            TOOLS["local_search"].execute(query=kw, limit=10)
            for kw in search_queries[:3]
        ]

        rss_results, local_results = await asyncio.gather(
            asyncio.gather(*rss_tasks, return_exceptions=True),
            asyncio.gather(*local_tasks, return_exceptions=True),
        )

        for result_set in [rss_results, local_results]:
            for r in result_set:
                if isinstance(r, list):
                    all_found.extend(r)

        # 第 3 步：去重
        seen_ids = set()
        unique = []
        for item in all_found:
            item_id = item.get("id")
            if item_id and item_id not in seen_ids:
                seen_ids.add(item_id)
                unique.append(item)

        # 第 4 步：角色筛选 + 打分
        scored = []
        for news in unique:
            score = self._calculate_relevance(news, None)
            if score > 0:
                news_copy = dict(news)
                news_copy["relevance_score"] = round(score, 1)
                news_copy["perspective_id"] = self.perspective_agent.perspective_id
                news_copy["perspective_name"] = self.perspective_name
                news_copy["matched_keywords"] = self._matched_keywords(news, None)
                news_copy["annotation"] = self._annotate(news, None)
                scored.append(news_copy)

        scored.sort(key=lambda x: x["relevance_score"], reverse=True)
        top_items = scored[:limit]

        # 第 5 步：LLM 标注
        if use_llm_annotate and top_items:
            await self._llm_annotate_batch(top_items[:3])

        # 第 6 步：存入新闻池
        if unique:
            self._save_to_pool(unique)

        return {
            "perspective": {
                "name": self.perspective_name,
                "emoji": self.perspective_agent._get_emoji(),
                "color": self.perspective_agent._get_color(),
                "keywords": self.interest_keywords,
            },
            "strategy": {
                "queries": search_queries,
                "reason": strategy_reason,
                "tools_used": ["rss_realtime", "local_search", "analyze_trends"],
            },
            "total_found": len(unique),
            "filtered_count": len(scored),
            "items": top_items,
        }

    # ============ 从缓存池搜索（旧接口，兼容） ============

    async def search_news(
        self,
        query: Optional[str] = None,
        limit: int = 10,
        category: Optional[str] = None,
        use_llm_annotate: bool = True,
    ) -> Dict[str, Any]:
        """从缓存池搜索新闻（兼容旧接口）"""
        from app.services.data_source import get_all_news

        news_pool = get_all_news()
        total_pool = len(news_pool)

        if query:
            query_lower = query.lower().strip()
            filtered = [
                n for n in news_pool
                if query_lower in (n.get("title", "") + n.get("summary", "")).lower()
            ]
            if len(filtered) < limit:
                filtered = self._filter_by_perspective(news_pool, min(limit * 2, 20))
                filtered = [n for n in filtered if query_lower in (n.get("title", "") + n.get("summary", "")).lower()] or filtered
        else:
            filtered = self._filter_by_perspective(news_pool, min(limit * 2, 20))

        if category:
            filtered = [n for n in filtered if n.get("category") == category]

        scored = []
        for news in filtered:
            score = self._calculate_relevance(news, query)
            if score > 0:
                news_copy = dict(news)
                news_copy["relevance_score"] = round(score, 1)
                news_copy["perspective_id"] = self.perspective_agent.perspective_id
                news_copy["perspective_name"] = self.perspective_name
                news_copy["matched_keywords"] = self._matched_keywords(news, query)
                news_copy["annotation"] = self._annotate(news, query)
                scored.append(news_copy)

        scored.sort(key=lambda x: x["relevance_score"], reverse=True)
        top_items = scored[:limit]

        if use_llm_annotate and top_items:
            await self._llm_annotate_batch(top_items[:3])

        return {
            "perspective": {
                "name": self.perspective_name,
                "emoji": self.perspective_agent._get_emoji(),
                "color": self.perspective_agent._get_color(),
                "keywords": self.interest_keywords,
            },
            "query": query or "",
            "category": category,
            "total_pool": total_pool,
            "filtered_count": len(scored),
            "items": top_items,
        }

    # ============ 流式输出 ============

    async def stream_search(
        self,
        query: Optional[str] = None,
        limit: int = 10,
        category: Optional[str] = None,
        use_llm_annotate: bool = True,
    ) -> AsyncIterator[Dict[str, Any]]:
        """流式输出搜索过程"""
        steps = [
            "正在分析角色兴趣，生成搜索策略...",
            "正在调用 RSS 实时抓取工具...",
            "正在搜索缓存新闻池...",
            "合并去重，按角色视角筛选...",
            "计算相关度，生成标注...",
        ]
        for step in steps:
            yield {"event": "thinking", "message": step, "perspective": self.perspective_name}
            await asyncio.sleep(0.4)

        result = await self.search_news(
            query=query, limit=limit, category=category, use_llm_annotate=use_llm_annotate
        )
        for i, item in enumerate(result["items"]):
            yield {"event": "item", "data": item, "index": i}
            await asyncio.sleep(0.3)

        yield {
            "event": "done",
            "data": {
                "total_pool": result["total_pool"],
                "filtered_count": result["filtered_count"],
                "returned": len(result["items"]),
            },
        }

    async def stream_autonomous_search(
        self,
        keywords: Optional[List[str]] = None,
        limit: int = 10,
        use_llm_strategy: bool = True,
        use_llm_annotate: bool = True,
    ) -> AsyncIterator[Dict[str, Any]]:
        """流式输出自主搜索过程"""
        steps = [
            "正在分析角色兴趣，让 LLM 生成搜索策略...",
            "正在调用 RSS 实时抓取工具获取最新新闻...",
            "正在搜索缓存新闻池...",
            "合并去重，按角色视角筛选...",
            "计算相关度，生成角色视角标注...",
            "将新发现的新闻存入新闻池...",
        ]
        for step in steps:
            yield {"event": "thinking", "message": step, "perspective": self.perspective_name}
            await asyncio.sleep(0.5)

        result = await self.autonomous_search(
            keywords=keywords, limit=limit,
            use_llm_strategy=use_llm_strategy, use_llm_annotate=use_llm_annotate,
        )
        for i, item in enumerate(result["items"]):
            yield {"event": "item", "data": item, "index": i}
            await asyncio.sleep(0.3)

        yield {
            "event": "done",
            "data": {
                "total_found": result["total_found"],
                "filtered_count": result["filtered_count"],
                "returned": len(result["items"]),
                "strategy": result.get("strategy", {}),
            },
        }

    # ============ 内部方法 ============

    def _filter_by_perspective(self, news_pool: List[Dict], limit: int) -> List[Dict]:
        scored = []
        for news in news_pool:
            score = self._calculate_relevance(news, None)
            if score > 0:
                scored.append((score, news))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [n for _, n in scored[:limit]]

    def _calculate_relevance(self, news: Dict, query: Optional[str]) -> float:
        import random
        score = 0.0
        title = news.get("title", "").lower()
        summary = news.get("summary", "").lower()
        content = news.get("content", "").lower()
        category = news.get("category", "")
        tags = [t.lower() for t in news.get("tags", [])]

        for kw in self.interest_keywords:
            kw_lower = kw.lower()
            if kw_lower in title:
                score += 25
            elif kw_lower in summary:
                score += 15
            elif kw_lower in content or kw_lower in tags:
                score += 8

        if query:
            q_lower = query.lower()
            if q_lower in title:
                score += 20
            elif q_lower in summary:
                score += 12

        if category in self.preferred_categories:
            score += 15

        views = news.get("views", 0)
        score += min(views / 1000000 * 10, 15)

        score += random.uniform(-3, 3)
        return max(0, min(100, score))

    def _matched_keywords(self, news: Dict, query: Optional[str]) -> List[str]:
        matched = []
        text = (news.get("title", "") + news.get("summary", "")).lower()
        for kw in self.interest_keywords:
            if kw.lower() in text:
                matched.append(kw)
        if query and query.lower() in text:
            matched.append(query)
        return matched[:5]

    def _annotate(self, news: Dict, query: Optional[str]) -> str:
        role = self.perspective_name
        matched = self._matched_keywords(news, query)
        if matched:
            return f"{role}关注：命中关键词「{', '.join(matched[:3])}」"
        return f"{role}视角：{news.get('title', '')[:30]}..."

    def _save_to_pool(self, items: List[Dict]):
        """将新发现的新闻存入本地缓存池"""
        try:
            from app.services.data_source import LOCAL_NEWS_FILE, load_json, save_json
            existing = load_json(LOCAL_NEWS_FILE)
            existing_ids = {n.get("id") for n in existing}
            new_items = [
                {k: v for k, v in item.items() if not k.startswith("_")}
                for item in items
                if item.get("id") not in existing_ids
            ]
            if new_items:
                existing.extend(new_items)
                save_json(LOCAL_NEWS_FILE, existing)
        except Exception:
            pass

    async def _llm_annotate_batch(self, items: List[Dict]) -> None:
        try:
            from app.services.llm_service import llm
            if not llm or not llm.enabled:
                return

            role = self.perspective_name
            for item in items:
                title = item.get("title", "")[:40]
                summary = item.get("summary", "")[:80]
                prompt = (
                    f"你是「{role}」。用一句话（15字内）说明你为什么会关注这条新闻。"
                    f"只返回原因，不要解释。\n新闻：{title}\n摘要：{summary}"
                )
                try:
                    annotation = await llm._generate_simple(prompt, max_tokens=40)
                    if annotation and len(annotation) > 2:
                        item["llm_annotation"] = annotation.strip()
                except Exception:
                    pass
                await asyncio.sleep(0.1)
        except Exception:
            pass


# ============ 后台自主搜索调度器 ============

_scheduler_running = False
_scheduler_task = None


async def _auto_search_loop(interval_minutes: int = 60):
    """后台自动搜索循环：每 N 分钟触发一次自主搜索"""
    global _scheduler_running
    _scheduler_running = True

    while _scheduler_running:
        try:
            from app.agents import get_all_perspectives
            perspectives = get_all_perspectives()
            # 从 perspectives 字典中取角色名
            names = list(perspectives.keys())[:5]  # 每次最多搜 5 个角色

            for name in names:
                try:
                    agent = NewsSearchAgent(name)
                    result = await agent.autonomous_search(
                        limit=5, use_llm_strategy=True, use_llm_annotate=False,
                    )
                except Exception:
                    pass
                await asyncio.sleep(2)  # 每个角色之间间隔 2 秒
        except Exception:
            pass

        await asyncio.sleep(interval_minutes * 60)


def start_auto_search(interval_minutes: int = 60):
    """启动后台自主搜索（在 main.py 中调用）"""
    global _scheduler_task
    if _scheduler_task and not _scheduler_task.done():
        return
    _scheduler_task = asyncio.create_task(_auto_search_loop(interval_minutes))


def stop_auto_search():
    """停止后台自主搜索"""
    global _scheduler_running, _scheduler_task
    _scheduler_running = False
    if _scheduler_task:
        _scheduler_task.cancel()


# ============ 便捷函数 ============

def search_news_for_perspective(
    perspective_name: str,
    query: Optional[str] = None,
    limit: int = 10,
    category: Optional[str] = None,
    use_llm_annotate: bool = True,
):
    agent = NewsSearchAgent(perspective_name)
    return asyncio.run(agent.search_news(
        query=query, limit=limit, category=category, use_llm_annotate=use_llm_annotate
    ))


async def search_news_for_perspective_async(
    perspective_name: str,
    query: Optional[str] = None,
    limit: int = 10,
    category: Optional[str] = None,
    use_llm_annotate: bool = True,
):
    agent = NewsSearchAgent(perspective_name)
    return await agent.search_news(
        query=query, limit=limit, category=category, use_llm_annotate=use_llm_annotate
    )
