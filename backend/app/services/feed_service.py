import asyncio
import time
import hashlib
from typing import List, Dict, Any, AsyncGenerator
from app.agents import get_agent
from app.services.data_source import get_all_news

_cache = {}
_cache_ttl = 60  # 缩短到 60 秒，确保用户切换视角时能尽快获取新鲜数据


def _get_cache_key(perspective: str, limit: int, category: str = None) -> str:
    key_str = f"{perspective}_{limit}_{category or 'all'}"
    h = hashlib.md5(key_str.encode()).hexdigest()[:12]
    return f"dyn_{h}"


def _get_from_cache(key: str) -> Any:
    cached = _cache.get(key)
    if cached and time.time() - cached["time"] < _cache_ttl:
        return cached["data"]
    return None


def _set_cache(key: str, data: Any) -> None:
    _cache[key] = {"time": time.time(), "data": data}


async def get_perspective_feed(
    perspective: str, limit: int = 8, category: str = None
) -> Dict[str, Any]:
    """获取视角新闻列表 — 选择视角时主动触发 NewsSearchAgent 获取新鲜数据"""
    cache_key = _get_cache_key(perspective, limit, category)
    cached = _get_from_cache(cache_key)
    if cached:
        return cached

    agent = get_agent(perspective)
    if not agent:
        return {"items": [], "insights": [], "hot_topics": [], "total": 0, "perspective": perspective}

    # 优先用 NewsSearchAgent 自主搜索新鲜数据（实时 RSS + 角色筛选）
    try:
        from app.agents.news_search_agent import NewsSearchAgent
        search_agent = NewsSearchAgent(perspective)
        search_result = await search_agent.autonomous_search(
            limit=limit, use_llm_strategy=False, use_llm_annotate=False,
        )
        items = search_result.get("items", [])
        if items:
            # 转换为 feed 格式
            feed_items = []
            for item in items:
                feed_items.append({
                    "id": item.get("id"),
                    "title": item.get("title", ""),
                    "summary": item.get("summary", ""),
                    "content": item.get("content", ""),
                    "source": item.get("source", ""),
                    "category": item.get("category", ""),
                    "tags": item.get("tags", []),
                    "publish_time": item.get("publish_time", ""),
                    "views": item.get("views", 0),
                    "image_url": item.get("image_url", ""),
                    "link": item.get("link", ""),
                    "relevance_score": item.get("relevance_score", 0),
                    "matched_keywords": item.get("matched_keywords", []),
                })
            result = {
                "perspective": perspective,
                "emoji": agent._get_emoji(),
                "color": agent._get_color(),
                "items": feed_items,
                "insights": [],
                "hot_topics": agent.get_hot_topics(feed_items),
                "total": len(feed_items),
                "source": "agent_search",
            }
            _set_cache(cache_key, result)
            return result
    except Exception:
        pass

    # 降级：从缓存池筛选
    news_pool = get_all_news()
    if category:
        news_pool = [n for n in news_pool if n["category"] == category]

    items, insights = await agent.filter_news(news_pool, limit)
    hot_topics = agent.get_hot_topics(items)

    result = {
        "perspective": perspective,
        "emoji": agent._get_emoji(),
        "color": agent._get_color(),
        "items": items,
        "insights": insights,
        "hot_topics": hot_topics,
        "total": len(items),
        "source": "cache_pool",
    }
    _set_cache(cache_key, result)
    return result


async def stream_perspective_feed(
    perspective: str, limit: int = 8, category: str = None
) -> AsyncGenerator[Dict, None]:
    agent = get_agent(perspective)
    if not agent:
        yield {"event": "done", "data": {"total": 0}}
        return

    news_pool = get_all_news()
    if category:
        news_pool = [n for n in news_pool if n["category"] == category]

    async for event in agent.stream_filter(news_pool, limit):
        yield event


def search_with_agents(query: str, perspective_names: List[str], limit: int = 30) -> Dict[str, Any]:
    from app.services.data_source import search_news as ds_search

    all_news = ds_search(query, limit=100)

    by_perspective = {}
    all_results = []

    for name in perspective_names:
        agent = get_agent(name)
        if not agent:
            continue
        scored = []
        for news in all_news:
            score = agent._calculate_relevance(news)
            if score > 5:
                news_copy = dict(news)
                news_copy["relevance_score"] = score
                news_copy["perspective_id"] = agent.perspective_id
                news_copy["perspective_name"] = name
                scored.append(news_copy)
        scored.sort(key=lambda x: x["relevance_score"], reverse=True)
        by_perspective[name] = scored[:5]
        all_results.extend(scored[:3])

    all_results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)

    return {
        "query": query,
        "results": all_results[:limit],
        "by_perspective": by_perspective,
        "total": len(all_results),
    }
