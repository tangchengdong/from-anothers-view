"""LLM 服务：封装 OpenAI 兼容接口调用，支持 DeepSeek/智谱/OpenAI 等。

无 API key 或调用失败时自动降级到规则模板，确保服务可用性。
"""
import httpx
import hashlib
import time
import json
from typing import Optional, AsyncGenerator, List, Dict
from app.config import settings


class LLMService:
    def __init__(self):
        self.api_key = settings.llm_api_key
        self.base_url = settings.llm_base_url
        self.model = settings.llm_model
        self.enabled = bool(self.api_key)
        self._client = None
        # 缓存：避免重复调用，控制 token 用量
        self._cache = {}
        self._cache_ttl = 3600  # 1 小时缓存

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(60.0, connect=15.0),
                limits=httpx.Limits(max_connections=10),
            )
        return self._client

    def _get_cache_key(self, news_id: int, perspective_id: str, prefix: str = "insight") -> str:
        """生成缓存键"""
        key_str = f"{prefix}_{news_id}_{perspective_id}"
        return hashlib.md5(key_str.encode()).hexdigest()[:16]

    def _get_from_cache(self, key: str) -> Optional[str]:
        """从缓存获取"""
        if key in self._cache:
            cached = self._cache[key]
            if time.time() - cached["time"] < self._cache_ttl:
                return cached["data"]
            else:
                del self._cache[key]
        return None

    def _set_cache(self, key: str, data: str) -> None:
        """设置缓存"""
        self._cache[key] = {"time": time.time(), "data": data}

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
        
        # 检查缓存
        news_id = news.get("id", 0)
        perspective_id = perspective_info.get("perspective_id", "")
        cache_key = self._get_cache_key(news_id, perspective_id, "insight")
        cached_result = self._get_from_cache(cache_key)
        if cached_result:
            return cached_result
        
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
                                '你是一个真实的' + perspective_info.get('role_name', '观察者') + '，'
                                '现在你正在刷手机看到一条新闻。请你用第一人称（「我」）'
                                '发表你的真实看法，要有态度、有情绪、有立场。'
                                '不要客观中立，不要总结概括，要像真人聊天一样说出你的第一反应。'
                                '2-3句话，100字以内。'
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 300,
                    "temperature": 0.9,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()
            # 如果返回空就用fallback
            result = content if content and len(content) > 5 else self._fallback_insight(news, perspective_info)
            
            # 只有有效结果才缓存
            if result and len(result) > 5:
                self._set_cache(cache_key, result)
            
            return result
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
                                '你是一个真实的' + perspective_info.get('role_name', '观察者') + '，'
                                '现在有人问你关于「' + query + '」的看法。'
                                '请你用第一人称（「我」）发表真实观点，'
                                '要有态度、有情绪、有立场，不要客观中立。'
                                '2-3句话，120字以内。'
                            ),
                        },
                        {
                            "role": "user",
                            "content": f"你怎么看：{query}",
                        },
                    ],
                    "max_tokens": 250,
                    "temperature": 0.9,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()
            return content if content else self._fallback_viewpoint(query, perspective_info)
        except Exception:
            return self._fallback_viewpoint(query, perspective_info)

    async def generate_deep_insight(
        self, news: dict, perspective_info: dict
    ) -> str:
        """生成深度视角评论（200-300字），替代前端 generateDeepOpinionByStyle。"""
        if not self.enabled:
            return self._fallback_deep_insight(news, perspective_info)

        # 检查缓存
        news_id = news.get("id", 0)
        perspective_id = perspective_info.get("perspective_id", "")
        cache_key = self._get_cache_key(news_id, perspective_id, "deep")
        cached_result = self._get_from_cache(cache_key)
        if cached_result:
            return cached_result

        try:
            title = news.get("title", "")
            summary = news.get("summary", "")
            category = news.get("category", "")
            role = perspective_info.get("role_name", "观察者")
            prompt = (
                f"资讯标题：{title}\n"
                f"摘要：{summary}\n"
                f"分类：{category}\n\n"
                f"请以{role}的视角，对这条资讯进行深度解读（200-300字），"
                f"包含：1)该群体如何看待此事 2)潜在影响 3)独特见解。"
            )
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
                                '你是一个真实的' + role + '，现在你正在刷手机看到一条新闻。'
                                '请你用第一人称（「我」）发表你的深度看法。'
                                '要有态度、有情绪、有立场，不要客观中立。'
                                '像真人发朋友圈一样，说出你的真实想法。'
                                '200-300字。'
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 600,
                    "temperature": 0.9,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()
            result = content if content else self._fallback_deep_insight(news, perspective_info)

            # 缓存结果
            self._set_cache(cache_key, result)
            return result
        except Exception:
            return self._fallback_deep_insight(news, perspective_info)

    async def _generate_simple(self, prompt: str, max_tokens: int = 40) -> str:
        """简单的一次性文本生成（用于新闻搜索 Agent 的简短标注等）。

        不走缓存，不构建复杂 prompt，直接返回生成文本。
        """
        if not self.enabled:
            return ""
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
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                    "temperature": 0.7,
                },
                timeout=15,
            )
            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()
            return content
        except Exception:
            return ""

    async def generate_stream(
        self, messages: List[Dict], max_tokens: int = 300, temperature: float = 0.8
    ) -> AsyncGenerator[str, None]:
        """流式生成（SSE），逐字返回内容。"""
        if not self.enabled:
            yield ""
            return

        client = self._get_client()
        async with client.stream(
            "POST",
            f"{self.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": messages,
                "stream": True,
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        content = chunk["choices"][0]["delta"].get("content", "")
                        if content:
                            yield content
                    except Exception:
                        continue

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

    def _fallback_deep_insight(self, news: dict, perspective_info: dict) -> str:
        """降级：深度评论模板"""
        emoji = perspective_info.get("emoji", "🔍")
        role = perspective_info.get("role_name", "观察者")
        title = news.get("title", "")
        summary = news.get("summary", "")
        return (
            f"{emoji} 从{role}的视角深度解读：\n\n"
            f"「{title}」这条资讯引起了我们的关注。{summary[:60]}...\n\n"
            f"作为{role}，我们认为这件事对该群体有着深远的影响。"
            f"首先，它反映了当前社会发展中值得关注的趋势；"
            f"其次，这可能会改变该群体的生活方式或思维模式；"
            f"最后，我们需要以更加开放和包容的心态来看待这一变化，"
            f"找到其中的机遇与挑战。"
        )

    def status(self) -> dict:
        """返回 LLM 服务状态（用于调试）"""
        return {
            "enabled": self.enabled,
            "model": self.model if self.enabled else None,
            "base_url": self.base_url if self.enabled else None,
        }


llm = LLMService()
