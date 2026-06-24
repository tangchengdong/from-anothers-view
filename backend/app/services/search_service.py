import random
from typing import List, Dict, Any, Optional
from app.services.data_source import search_news as ds_search, get_all_news
from app.agents import get_agent, get_random_perspective, _ROLE_POOL


def _generate_simulated_news(query: str, limit: int = 12) -> List[Dict]:
    sources = ["微博热搜", "知乎热榜", "今日头条", "36氪", "虎嗅", "B站热门",
               "小红书", "微信公众号", "抖音热点", "豆瓣", "澎湃新闻", "央视新闻"]
    templates = [
        {"title": f"「{query}」最新动态：多方关注事态发展", "summary": f"关于{query}的最新消息和各方解读，一文了解全貌"},
        {"title": f"深度解读：{query}背后的原因和影响", "summary": f"专家分析{query}的来龙去脉，带你看清本质"},
        {"title": f"{query}上热搜，网友热议不断", "summary": f"{query}引发全网讨论，各方观点碰撞"},
        {"title": f"关于{query}，你需要知道的5件事", "summary": f"全面梳理{query}的关键信息点"},
        {"title": f"{query}持续发酵，行业格局或将生变", "summary": f"{query}带来的连锁反应正在显现"},
        {"title": f"从{query}看新趋势", "summary": f"{query}不是孤立事件，它折射出更深层的趋势"},
        {"title": f"{query}引发争议，支持者和反对者各执一词", "summary": f"{query}为什么会有如此分歧的看法"},
        {"title": f"亲历者讲述：{query}真实体验是什么样", "summary": f"不再只看报道，听听当事人的真实感受"},
        {"title": f"{query}相关产业链一览，谁在受益", "summary": f"{query}带火了哪些行业和产品"},
        {"title": f"一文读懂{query}的前世今生", "summary": f"从起源到当下，全面了解{query}的演变"},
        {"title": f"{query}之后，下一步会怎样", "summary": f"展望{query}的未来走向和可能的影响"},
        {"title": f"数据说话：{query}到底有多火", "summary": f"用数据量化{query}的热度和传播趋势"},
    ]

    results = []
    for i, tpl in enumerate(templates[:limit]):
        role = random.choice(_ROLE_POOL)
        score = random.uniform(60, 95)
        results.append({
            "id": 9000 + i,
            "title": tpl["title"],
            "summary": tpl["summary"],
            "content": f"这是关于「{query}」的模拟资讯内容。在真实场景中，这里会展示从各大数据源采集的真实新闻报道和深度分析。",
            "source": random.choice(sources),
            "category": "综合资讯",
            "tags": [query, role["name"], "热点"],
            "publish_time": "2024-03-15",
            "views": random.randint(100000, 5000000),
            "image_url": f"https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt={query}%20news%20illustration&image_size=square_hd",
            "relevance_score": score,
            "perspective_id": f"dyn_sim_{i}",
            "perspective_name": role["name"],
            "simulated": True,
        })
    return results


def _get_agent_commentaries(query: str, perspective_names: List[str]) -> List[Dict]:
    commentaries = []
    for name in perspective_names:
        name = name.strip()
        if not name:
            continue
        agent = get_agent(name)
        if agent:
            commentary = agent.generate_commentary(query)
            commentary["perspective_name"] = name
            commentaries.append(commentary)
    return commentaries


def search_all(query: str, limit: int = 50) -> List[Dict]:
    all_news = ds_search(query, limit=limit)
    if not all_news:
        all_news = _generate_simulated_news(query, limit)
    return all_news


def search_with_perspectives(
    query: str,
    limit: int = 20,
    perspectives: Optional[List[str]] = None,
) -> Dict[str, Any]:
    real_results = ds_search(query, limit=limit)
    is_simulated = False

    if not real_results:
        real_results = _generate_simulated_news(query, limit)
        is_simulated = True

    if not perspectives:
        perspectives = []

    commentaries = _get_agent_commentaries(query, perspectives)

    by_perspective = {}
    for name in perspectives:
        agent = get_agent(name)
        if not agent:
            continue
        scored = []
        for news in real_results:
            score = agent._calculate_relevance(news)
            if score > 0:
                news_copy = dict(news)
                news_copy["relevance_score"] = score
                news_copy["perspective_id"] = agent.perspective_id
                news_copy["perspective_name"] = name
                scored.append(news_copy)
        scored.sort(key=lambda x: x["relevance_score"], reverse=True)
        by_perspective[name] = scored[:5]

    return {
        "query": query,
        "results": real_results,
        "commentaries": commentaries,
        "by_perspective": by_perspective,
        "total": len(real_results),
        "is_simulated": is_simulated,
        "perspectives": perspectives,
    }
