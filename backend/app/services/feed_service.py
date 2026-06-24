import asyncio
import time
import hashlib
from typing import List, Dict, Any, AsyncGenerator
from app.agents import get_agent
from app.services.data_source import get_all_news

_cache = {}
_cache_ttl = 300


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
    cache_key = _get_cache_key(perspective, limit, category)
    cached = _get_from_cache(cache_key)
    if cached:
        return cached

    agent = get_agent(perspective)
    if not agent:
        return {"items": [], "insights": [], "hot_topics": [], "total": 0, "perspective": perspective}

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
