"""LLM 服务：封装 OpenAI 兼容接口调用，支持 DeepSeek/智谱/OpenAI 等。

无 API key 或调用失败时自动降级到规则模板，确保服务可用性。
"""
import httpx
from typing import Optional
from app.config import settings


class LLMService:
    def __init__(self):
        self.api_key = settings.llm_api_key
        self.base_url = settings.llm_base_url
        self.model = settings.llm_model
        self.enabled = bool(self.api_key)
        self._client = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(15.0, connect=8.0),
                limits=httpx.Limits(max_connections=10),
            )
        return self._client

    async def generate_insight(
        self, news: dict, perspective_info: dict
    ) -> str:
        """根据资讯 + 视角信息生成 1-2 句视角解读。

        Args:
            news: 资讯 dict，含 title/summary/category
            perspective_info: 视角信息，含 role_name/emoji/perspective_id

        Returns:
            视角解读文本
        """
        if not self.enabled:
            return self._fallback_insight(news, perspective_info)
        try:
            prompt = self._build_prompt(news, perspective_info)
            client = self._get_client()
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                f"你是{perspective_info.get('role_name', '观察者')}，"
                                f"用该视角解读资讯，输出1-2句话，"
                                f"语气自然有洞察力，不超过80字。"
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 120,
                    "temperature": 0.7,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()
            return content if content else self._fallback_insight(news, perspective_info)
        except Exception:
            return self._fallback_insight(news, perspective_info)

    async def generate_viewpoint(
        self, query: str, perspective_info: dict
    ) -> str:
        """对搜索话题生成该视角的观点评论（用于搜索结果）。

        Args:
            query: 搜索关键词
            perspective_info: 视角信息

        Returns:
            观点评论文本（2-3句话）
        """
        if not self.enabled:
            return self._fallback_viewpoint(query, perspective_info)
        try:
            client = self._get_client()
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                f"你是{perspective_info.get('role_name', '观察者')}，"
                                f"从该视角评论「{query}」，输出2-3句话，"
                                f"有独特观点，不超过120字。"
                            ),
                        },
                        {
                            "role": "user",
                            "content": f"请从你的视角评论：{query}",
                        },
                    ],
                    "max_tokens": 180,
                    "temperature": 0.8,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()
            return content if content else self._fallback_viewpoint(query, perspective_info)
        except Exception:
            return self._fallback_viewpoint(query, perspective_info)

    def _build_prompt(self, news: dict, perspective_info: dict) -> str:
        title = news.get("title", "")
        summary = news.get("summary", "")
        category = news.get("category", "")
        role = perspective_info.get("role_name", "观察者")
        return (
            f"资讯标题：{title}\n"
            f"摘要：{summary}\n"
            f"分类：{category}\n\n"
            f"请以{role}的视角，用1-2句话解读这条资讯对这个群体的意义或影响。"
        )

    def _fallback_insight(self, news: dict, perspective_info: dict) -> str:
        """降级：基于视角信息 + 资讯标题的模板"""
        emoji = perspective_info.get("emoji", "🔍")
        role = perspective_info.get("role_name", "观察者")
        title = news.get("title", "")
        short_title = title[:24] + "..." if len(title) > 24 else title
        return f"{emoji} 从{role}的视角看，「{short_title}」值得关注其对该群体的实际影响。"

    def _fallback_viewpoint(self, query: str, perspective_info: dict) -> str:
        """降级：搜索观点模板"""
        emoji = perspective_info.get("emoji", "🔍")
        role = perspective_info.get("role_name", "观察者")
        return f"{emoji} 从{role}的角度来看，「{query}」是一个需要被看见的议题，它关系到这个群体的切身利益与未来发展。"

    def status(self) -> dict:
        """返回 LLM 服务状态（用于调试）"""
        return {
            "enabled": self.enabled,
            "model": self.model if self.enabled else None,
            "base_url": self.base_url if self.enabled else None,
        }


llm = LLMService()
