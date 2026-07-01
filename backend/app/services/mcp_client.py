"""
MCP 新闻数据源客户端
- 调用 chinese-social-signals MCP 服务获取头条新闻
- 支持 get_toutiao_news / get_weibo_hot_search / get_china_trends
- 内存缓存 + 定时刷新 + 失败降级
"""
import os
import json
import time
import hashlib
import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)

# ============ 配置 ============
MCP_URL = os.getenv("MCP_NEWS_URL", "https://nexgendata--chinese-social-signals-mcp.apify.actor/mcp")
MCP_API_KEY = os.getenv("MCP_NEWS_API_KEY", "")
MCP_ENABLED = bool(MCP_API_KEY)

# 缓存
_mcp_cache: List[Dict] = []
_cache_time: float = 0
_cache_ttl = 1800  # 30 分钟刷新一次
_last_fetch_status: str = "not_started"


def _generate_id(title: str, source: str) -> int:
    """基于标题+来源生成稳定 ID"""
    key = f"{source}:{title}"
    h = hashlib.md5(key.encode("utf-8")).hexdigest()
    return int(h[:8], 16) % 9000000 + 100000


def _parse_mcp_item(item: Dict, source_name: str, category: str) -> Optional[Dict]:
    """将 MCP 返回的原始数据转换为统一资讯格式"""
    title = item.get("title") or item.get("word") or item.get("name") or ""
    title = title.strip()
    if not title:
        return None

    summary = item.get("summary") or item.get("description") or item.get("abstract") or ""
    if len(summary) > 200:
        summary = summary[:200] + "..."

    # 图片
    image_url = item.get("image") or item.get("img") or item.get("pic") or ""
    if not image_url:
        prompt = title[:20].replace(" ", "%20")
        image_url = f"https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt={prompt}%20news&image_size=square_hd"

    # 浏览量
    hot = item.get("hot") or item.get("num") or item.get("heat") or 0
    if isinstance(hot, str):
        hot = int("".join(filter(str.isdigit, hot)) or "0")

    return {
        "id": _generate_id(title, source_name),
        "title": title,
        "summary": summary or title,
        "content": summary or title,
        "source": source_name,
        "category": category,
        "tags": [source_name, category],
        "publish_time": datetime.now().strftime("%Y-%m-%d"),
        "views": hot,
        "image_url": image_url,
        "perspective_id": "",
        "link": item.get("url") or item.get("link") or "",
        "is_mcp": True,
    }


async def _mcp_call(tool_name: str, arguments: Dict, timeout: float = 25.0) -> Any:
    """调用 MCP 工具（Streamable HTTP 协议）"""
    if not MCP_ENABLED:
        return None

    headers = {
        "Authorization": f"Bearer {MCP_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            # Step 1: Initialize
            init_resp = await client.post(MCP_URL, headers=headers, json={
                "jsonrpc": "2.0", "id": 1, "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "clientInfo": {"name": "from-anothers-view", "version": "1.0"}
                }
            })

            if init_resp.status_code != 200:
                logger.warning("MCP init 失败: HTTP %s", init_resp.status_code)
                return None

            session_id = init_resp.headers.get("Mcp-Session-Id", "")
            if session_id:
                headers["Mcp-Session-Id"] = session_id

            # Step 2: Notification
            try:
                await client.post(MCP_URL, headers=headers, json={
                    "jsonrpc": "2.0", "method": "notifications/initialized", "params": {}
                })
            except Exception:
                pass

            # Step 3: Call tool
            tool_resp = await client.post(MCP_URL, headers=headers, json={
                "jsonrpc": "2.0", "id": 10, "method": "tools/call",
                "params": {"name": tool_name, "arguments": arguments}
            })

            if tool_resp.status_code != 200:
                logger.warning("MCP 工具调用失败: %s - HTTP %s", tool_name, tool_resp.status_code)
                return None

            # 解析 SSE 响应
            raw = tool_resp.text
            for line in raw.split("\n"):
                if line.startswith("data: "):
                    try:
                        parsed = json.loads(line[6:])
                        if parsed.get("jsonrpc") and parsed.get("result"):
                            content = parsed["result"].get("content", [])
                            for item in content:
                                if item.get("type") == "text":
                                    return json.loads(item["text"])
                    except (json.JSONDecodeError, KeyError):
                        pass

    except httpx.TimeoutException:
        logger.warning("MCP 调用超时: %s (timeout=%.1fs)", tool_name, timeout)
    except httpx.ConnectError as e:
        logger.warning("MCP 连接失败: %s - %s", tool_name, e)
    except httpx.HTTPError as e:
        logger.warning("MCP HTTP 错误: %s - %s: %s", tool_name, type(e).__name__, e)
    except Exception as e:
        logger.warning("MCP 调用异常: %s - %s: %s", tool_name, type(e).__name__, e)

    return None


async def fetch_toutiao_news(limit: int = 10) -> List[Dict]:
    """获取今日头条热榜"""
    data = await _mcp_call("get_toutiao_news", {"criteria": {"mode": "hot"}, "limit": limit})
    if not data:
        return []

    items = data if isinstance(data, list) else data.get("data", data.get("items", []))
    if isinstance(data, dict) and not items:
        # 可能是 { "data": [...] } 或其他结构
        for key, val in data.items():
            if isinstance(val, list) and val:
                items = val
                break

    result = []
    for item in (items or []):
        parsed = _parse_mcp_item(item, "今日头条", "社会热点")
        if parsed:
            result.append(parsed)
    return result


async def fetch_weibo_hot(limit: int = 10) -> List[Dict]:
    """获取微博热搜"""
    data = await _mcp_call("get_weibo_hot_search", {"criteria": {"mode": "trending"}, "limit": limit})
    if not data:
        return []

    items = data if isinstance(data, list) else data.get("data", data.get("items", []))
    if isinstance(data, dict) and not items:
        for key, val in data.items():
            if isinstance(val, list) and val:
                items = val
                break

    result = []
    for item in (items or []):
        parsed = _parse_mcp_item(item, "微博热搜", "社会热点")
        if parsed:
            result.append(parsed)
    return result


async def fetch_china_trends(limit: int = 10) -> List[Dict]:
    """获取综合趋势（微博+百度+抖音）"""
    data = await _mcp_call("get_china_trends", {"criteria": {}, "limit": limit})
    if not data:
        return []

    items = data if isinstance(data, list) else data.get("data", data.get("items", []))
    if isinstance(data, dict) and not items:
        for key, val in data.items():
            if isinstance(val, list) and val:
                items = val
                break

    result = []
    for item in (items or []):
        source = item.get("source", item.get("platform", "综合趋势"))
        parsed = _parse_mcp_item(item, source, "综合趋势")
        if parsed:
            result.append(parsed)
    return result


async def fetch_all_mcp_news() -> List[Dict]:
    """并发获取所有 MCP 新闻源"""
    global _last_fetch_status
    all_items = []

    try:
        results = await asyncio.gather(
            fetch_toutiao_news(8),
            fetch_weibo_hot(8),
            fetch_china_trends(8),
            return_exceptions=True,
        )
        for r in results:
            if isinstance(r, list):
                all_items.extend(r)

        # 按 views 倒序
        all_items.sort(key=lambda x: x.get("views", 0), reverse=True)
        _last_fetch_status = f"ok({len(all_items)} items)"
    except Exception as e:
        _last_fetch_status = f"error: {type(e).__name__}: {e}"

    return all_items


def get_mcp_news() -> List[Dict]:
    """获取 MCP 新闻（带缓存）"""
    global _mcp_cache, _cache_time
    if _mcp_cache and time.time() - _cache_time < _cache_ttl:
        return _mcp_cache
    return _mcp_cache  # 缓存过期但仍有数据时返回旧数据


def is_mcp_available() -> bool:
    """MCP 服务是否可用"""
    return MCP_ENABLED


def get_mcp_status() -> Dict[str, Any]:
    """获取 MCP 状态信息"""
    return {
        "enabled": MCP_ENABLED,
        "cache_size": len(_mcp_cache),
        "cache_age": int(time.time() - _cache_time) if _cache_time else None,
        "cache_ttl": _cache_ttl,
        "last_status": _last_fetch_status,
    }


def set_mcp_cache(items: List[Dict]) -> None:
    """更新缓存"""
    global _mcp_cache, _cache_time
    _mcp_cache = items
    _cache_time = time.time()


def refresh_mcp_cache_sync() -> int:
    """同步刷新缓存"""
    items = asyncio.run(fetch_all_mcp_news())
    if items:
        set_mcp_cache(items)
    return len(items)


async def refresh_mcp_cache_async() -> int:
    """异步刷新缓存"""
    items = await fetch_all_mcp_news()
    if items:
        set_mcp_cache(items)
    return len(items)
