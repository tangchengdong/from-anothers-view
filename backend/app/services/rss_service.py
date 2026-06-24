"""
RSS 订阅服务
- 异步抓取多个 RSS 源
- 解析为统一的资讯数据格式
- 内存缓存 + 定时刷新
"""
import time
import hashlib
import re
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import feedparser
import httpx

from app.data.rss_feeds import RSS_FEEDS


# 内存缓存
_rss_cache: List[Dict] = []
_cache_time: float = 0
_cache_ttl = 600  # 10 分钟刷新一次
_last_fetch_status: Dict[str, str] = {}  # 各源的抓取状态


def _strip_html(text: str) -> str:
    """去除 HTML 标签"""
    if not text:
        return ""
    clean = re.compile(r"<[^>]+>")
    return clean.sub("", text).strip()


def _generate_id(entry: Dict, source_name: str) -> int:
    """基于条目链接或标题生成稳定 ID"""
    key = entry.get("link", "") or entry.get("title", "") or source_name
    h = hashlib.md5(key.encode("utf-8")).hexdigest()
    return int(h[:8], 16) % 9000000 + 100000  # 100000-9100000 范围


def _parse_date(entry: Dict) -> str:
    """解析发布时间"""
    for field in ["published_parsed", "updated_parsed"]:
        t = entry.get(field)
        if t:
            try:
                dt = datetime(*t[:6])
                return dt.strftime("%Y-%m-%d")
            except Exception:
                pass
    # 回退到字符串字段
    for field in ["published", "updated", "created"]:
        s = entry.get(field)
        if s:
            return s[:10] if len(s) >= 10 else s
    return datetime.now().strftime("%Y-%m-%d")


def _extract_image(entry: Dict, feed_config: Dict) -> str:
    """提取条目图片"""
    # 1. media_thumbnail / media_content
    for key in ["media_thumbnail", "media_content"]:
        media = entry.get(key)
        if media and isinstance(media, list) and media[0].get("url"):
            return media[0]["url"]
    # 2. enclosures
    enclosures = entry.get("enclosures", [])
    for enc in enclosures:
        if enc.get("type", "").startswith("image") and enc.get("href"):
            return enc["href"]
    # 3. 内容中的第一张图
    content = entry.get("content", [{}])
    if isinstance(content, list) and content:
        html = content[0].get("value", "")
    else:
        html = entry.get("summary", "") or entry.get("description", "")
    match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html)
    if match:
        return match.group(1)
    # 4. 回退到默认生成图
    title = entry.get("title", "news")
    prompt = title[:20].replace(" ", "%20")
    return f"https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt={prompt}%20news%20article&image_size=square_hd"


def _extract_summary(entry: Dict) -> str:
    """提取摘要"""
    summary = entry.get("summary", "") or entry.get("description", "")
    text = _strip_html(summary)
    if len(text) > 120:
        text = text[:120] + "..."
    return text or entry.get("title", "")


def _extract_content(entry: Dict) -> str:
    """提取正文"""
    content = entry.get("content", [{}])
    if isinstance(content, list) and content:
        html = content[0].get("value", "")
    else:
        html = entry.get("summary", "") or entry.get("description", "")
    text = _strip_html(html)
    if len(text) > 2000:
        text = text[:2000] + "..."
    return text or entry.get("title", "")


def _convert_entry(entry: Dict, feed_config: Dict) -> Optional[Dict]:
    """将 feedparser 条目转换为统一数据格式"""
    title = entry.get("title", "").strip()
    if not title:
        return None

    return {
        "id": _generate_id(entry, feed_config["name"]),
        "title": title,
        "summary": _extract_summary(entry),
        "content": _extract_content(entry),
        "source": feed_config["name"],
        "category": feed_config.get("category", "综合资讯"),
        "tags": feed_config.get("tags", [])[:3],
        "publish_time": _parse_date(entry),
        "views": 0,  # RSS 无浏览量，用 0 占位
        "image_url": _extract_image(entry, feed_config),
        "perspective_id": feed_config.get("perspective", ""),
        "link": entry.get("link", ""),
        "is_rss": True,
    }


async def _fetch_one_feed(
    client: httpx.AsyncClient, feed_config: Dict
) -> List[Dict]:
    """抓取单个 RSS 源"""
    url = feed_config["url"]
    name = feed_config["name"]
    try:
        resp = await client.get(url, timeout=12.0)
        resp.raise_for_status()
        # feedparser 解析字节流
        parsed = feedparser.parse(resp.content)
        if not parsed.entries:
            _last_fetch_status[name] = "empty"
            return []

        items = []
        for entry in parsed.entries[:15]:  # 每源最多15条
            item = _convert_entry(entry, feed_config)
            if item:
                items.append(item)
        _last_fetch_status[name] = f"ok({len(items)})"
        return items
    except Exception as e:
        _last_fetch_status[name] = f"error: {type(e).__name__}"
        return []


async def fetch_all_feeds() -> List[Dict]:
    """并发抓取所有 RSS 源"""
    all_items = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        tasks = [_fetch_one_feed(client, cfg) for cfg in RSS_FEEDS]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for result in results:
            if isinstance(result, list):
                all_items.extend(result)

    # 按发布时间倒序
    all_items.sort(key=lambda x: x.get("publish_time", ""), reverse=True)
    return all_items


def get_rss_news() -> List[Dict]:
    """获取 RSS 资讯（带缓存）"""
    global _rss_cache, _cache_time
    if _rss_cache and time.time() - _cache_time < _cache_ttl:
        return _rss_cache
    return _rss_cache  # 缓存过期但仍有数据时返回旧数据，由后台刷新


def get_fetch_status() -> Dict[str, str]:
    """获取各 RSS 源的抓取状态"""
    return dict(_last_fetch_status)


def get_cache_info() -> Dict[str, Any]:
    """获取缓存信息"""
    return {
        "cache_size": len(_rss_cache),
        "cache_age": int(time.time() - _cache_time) if _cache_time else None,
        "cache_ttl": _cache_ttl,
        "is_expired": time.time() - _cache_time > _cache_ttl if _cache_time else True,
        "fetch_status": dict(_last_fetch_status),
    }


def set_cache(items: List[Dict]) -> None:
    """更新缓存"""
    global _rss_cache, _cache_time
    _rss_cache = items
    _cache_time = time.time()


def is_cache_empty() -> bool:
    """缓存是否为空"""
    return len(_rss_cache) == 0


def refresh_cache_sync() -> int:
    """同步刷新缓存（用于后台任务或启动时），返回条目数"""
    items = asyncio.run(fetch_all_feeds())
    if items:
        set_cache(items)
    return len(items)


async def refresh_cache_async() -> int:
    """异步刷新缓存，返回条目数"""
    items = await fetch_all_feeds()
    if items:
        set_cache(items)
    return len(items)
