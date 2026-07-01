import json
import os
from typing import List, Dict, Any
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
MOCK_NEWS_FILE = DATA_DIR / "mock_news.json"
LOCAL_NEWS_FILE = DATA_DIR / "local_news.json"
USERS_FILE = DATA_DIR / "users.json"


def load_json(filepath: Path) -> Any:
    if not filepath.exists():
        return [] if filepath.name.endswith("news.json") else {}
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(filepath: Path, data: Any) -> None:
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _get_rss_news() -> List[Dict]:
    """从 RSS 实时缓存获取资讯"""
    try:
        from app.services.rss_service import get_rss_news, is_cache_empty
        if not is_cache_empty():
            return get_rss_news()
    except Exception:
        pass
    return []


def _get_mcp_news() -> List[Dict]:
    """从 MCP 服务获取今日头条/微博/综合趋势"""
    try:
        from app.services.mcp_client import get_mcp_news, is_mcp_available
        if is_mcp_available():
            return get_mcp_news()
    except Exception:
        pass
    return []


def _get_local_news() -> List[Dict]:
    """从本地爬取数据获取资讯（稳定数据源）"""
    return load_json(LOCAL_NEWS_FILE)


def _deduplicate(items: List[Dict]) -> List[Dict]:
    """按 ID 去重，优先保留 RSS 实时数据"""
    seen = set()
    result = []
    for item in items:
        item_id = item.get("id")
        if item_id not in seen:
            seen.add(item_id)
            result.append(item)
    return result


def _days_ago(date_str: str) -> int:
    """粗略估算日期字符串距离今天的天数（越大越旧）"""
    from datetime import datetime
    try:
        d = datetime.strptime(date_str[:10], "%Y-%m-%d")
        return (datetime.now() - d).days
    except Exception:
        return 999


def get_all_news() -> List[Dict]:
    """获取全部资讯：合并 RSS + MCP + 本地爬取 + mock 数据
    优先级：RSS 实时缓存 > MCP 热点 > 本地爬取数据（仅最近 7 天） > mock 数据

    关键：RSS 数据优先展示，本地数据仅作为补充（限制最近 7 天），
    避免旧的爬取数据（固定日期）淹没有时效性的 RSS 新闻。
    """
    rss_news = _get_rss_news()
    mcp_news = _get_mcp_news()
    local_news = _get_local_news()

    if not rss_news and not mcp_news:
        # RSS 和 MCP 都不可用时，使用全部本地数据
        if local_news:
            local_news.sort(key=lambda x: x.get("publish_time", ""), reverse=True)
            return _deduplicate(local_news)
        return load_json(MOCK_NEWS_FILE)

    # RSS/MCP 可用：只取最近 7 天的本地数据作为补充（避免旧数据淹没新数据）
    fresh_local = [
        n for n in local_news if _days_ago(n.get("publish_time", "")) <= 7
    ]

    # 合并：RSS 最新 → MCP → 本地（新鲜） → 去重
    combined = rss_news + mcp_news + fresh_local
    deduped = _deduplicate(combined)

    # 按发布时间倒序排列，确保最新新闻排在前面
    deduped.sort(key=lambda x: x.get("publish_time", ""), reverse=True)

    return deduped


def get_news_by_id(news_id: int) -> Dict:
    news_list = get_all_news()
    for item in news_list:
        if item["id"] == news_id:
            return item
    return None


def search_news(keyword: str, limit: int = 50) -> List[Dict]:
    news_list = get_all_news()
    keyword = keyword.lower()
    results = []
    for item in news_list:
        if (
            keyword in item["title"].lower()
            or keyword in item["summary"].lower()
            or keyword in item["content"].lower()
            or any(keyword in tag.lower() for tag in item.get("tags", []))
        ):
            results.append(item)
    return results[:limit]


def get_users() -> Dict:
    return load_json(USERS_FILE)


def save_users(users: Dict) -> None:
    save_json(USERS_FILE, users)


def get_user_by_username(username: str) -> Dict:
    users = get_users()
    return users.get(username)


def update_user(username: str, user_data: Dict) -> None:
    users = get_users()
    users[username] = user_data
    save_users(users)
