import asyncio
import json
import random
from typing import List, Dict, Any, Tuple
from abc import ABC, abstractmethod


class BaseAgent(ABC):
    perspective_id: str = ""
    role_name: str = ""
    system_prompt: str = ""
    interest_keywords: List[str] = []
    preferred_categories: List[str] = []

    def __init__(self):
        self._thinking_steps = [
            f"{self.role_name}正在浏览资讯池...",
            f"{self.role_name}在筛选感兴趣的话题...",
            f"{self.role_name}在评估内容质量...",
            f"{self.role_name}正在整理推荐列表...",
        ]

    async def filter_news(
        self, news_pool: List[Dict], limit: int = 8
    ) -> Tuple[List[Dict], List[str]]:
        scored = []
        for news in news_pool:
            score = self._calculate_relevance(news)
            if score > 0:
                news_copy = dict(news)
                news_copy["relevance_score"] = score
                news_copy["perspective_id"] = self.perspective_id
                news_copy["perspective_name"] = self.role_name
                scored.append(news_copy)

        scored.sort(key=lambda x: x["relevance_score"], reverse=True)
        selected = scored[:limit]

        insights = await self._generate_insights(selected)
        return selected, insights

    def _calculate_relevance(self, news: Dict) -> float:
        score = 0.0
        title = news.get("title", "").lower()
        summary = news.get("summary", "").lower()
        content = news.get("content", "").lower()
        category = news.get("category", "")
        tags = [t.lower() for t in news.get("tags", [])]
        text = title + " " + summary + " " + content

        if category in self.preferred_categories:
            score += 40

        for keyword in self.interest_keywords:
            if keyword.lower() in text or keyword.lower() in tags:
                score += 15

        views = news.get("views", 0)
        popularity_score = min(views / 1000000 * 10, 20)
        score += popularity_score

        score += random.uniform(-5, 5)

        return max(0, min(100, score))

    async def _generate_insights(self, news_list: List[Dict]) -> List[str]:
        if not news_list:
            return []

        from app.services.llm_service import llm

        perspective_info = {
            "role_name": self.role_name,
            "emoji": self._get_emoji(),
            "perspective_id": self.perspective_id,
        }

        # 用 LLM 为前 3 条资讯生成视角解读（无 key 时自动降级）
        insights = []
        for news in news_list[:3]:
            insight = await llm.generate_insight(news, perspective_info)
            insights.append(insight)

        return insights

    def get_hot_topics(self, news_list: List[Dict]) -> List[str]:
        topics = set()
        for news in news_list:
            topics.add(news.get("category", ""))
            for tag in news.get("tags", [])[:2]:
                topics.add(tag)
        topics.discard("")
        return list(topics)[:5]

    def generate_commentary(self, query: str) -> Dict[str, Any]:
        """对任意搜索话题生成该视角的观点评论"""
        return {
            "perspective_id": self.perspective_id,
            "role_name": self.role_name,
            "emoji": self._get_emoji(),
            "color": self._get_color(),
            "headline": self._generate_headline(query),
            "viewpoint": self._generate_viewpoint(query),
            "tags": self._generate_tags(query),
        }

    def _get_emoji(self) -> str:
        return "🔍"

    def _get_color(self) -> str:
        return "#8B5CF6"

    def _generate_headline(self, query: str) -> str:
        return f"{self.role_name}看「{query}」"

    def _generate_viewpoint(self, query: str) -> str:
        return f"从{self.role_name}的角度来看，{query}是一个值得关注的话题。"

    def _generate_tags(self, query: str) -> List[str]:
        return [query, self.role_name]

    def get_thinking_steps(self) -> List[str]:
        return self._thinking_steps

    async def stream_filter(
        self, news_pool: List[Dict], limit: int = 8
    ):
        for step in self._thinking_steps:
            yield {"event": "thinking", "message": step}
            await asyncio.sleep(0.6)

        selected, insights = await self.filter_news(news_pool, limit)

        for i, item in enumerate(selected):
            yield {"event": "item", "data": item, "index": i}
            await asyncio.sleep(0.4)

        for insight in insights:
            yield {"event": "insight", "data": {"text": insight}}
            await asyncio.sleep(0.3)

        hot_topics = self.get_hot_topics(selected)
        for topic in hot_topics:
            yield {"event": "topic", "data": {"name": topic}}
            await asyncio.sleep(0.2)

        yield {"event": "done", "data": {"total": len(selected)}}
