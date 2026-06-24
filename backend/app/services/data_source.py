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


def get_all_news() -> List[Dict]:
    """获取全部资讯：合并 RSS 实时 + 本地爬取 + mock 数据
    优先级：RSS 实时缓存 > 本地爬取数据 > mock 数据
    """
    rss_news = _get_rss_news()
    local_news = _get_local_news()

    # 合并 RSS + 本地数据（去重）
    if rss_news and local_news:
        combined = _deduplicate(rss_news + local_news)
        return combined
    elif rss_news:
        return rss_news
    elif local_news:
        return local_news
    else:
        # 都没有时回退到 mock 数据
        return load_json(MOCK_NEWS_FILE)


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
