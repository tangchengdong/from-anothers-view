import json
import time
import jwt
import bcrypt
from typing import Optional
from app.config import settings
from app.services.data_source import get_users, save_users, get_user_by_username, update_user

USERS_FILE = "users.json"


def _hash_password(password: str) -> str:
    """bcrypt 哈希（自动加盐），返回 str"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    """校验密码：兼容 bcrypt（$2b$）与旧 sha256 哈希"""
    if hashed.startswith("$2b$") or hashed.startswith("$2a$") or hashed.startswith("$2y$"):
        try:
            return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
        except Exception:
            return False
    # 旧 sha256 兼容（用于迁移前已存在的用户）
    import hashlib
    return hashlib.sha256(password.encode("utf-8")).hexdigest() == hashed


def _generate_token(user_id: int, username: str) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": int(time.time()) + 86400 * 7,  # 7 days
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def login(username: str, password: str) -> dict:
    user = get_user_by_username(username)
    if not user:
        return {"success": False, "message": "用户不存在"}

    if not _verify_password(password, user["password_hash"]):
        return {"success": False, "message": "密码错误"}

    token = _generate_token(user["id"], user["username"])
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "nickname": user["nickname"],
            "avatar": user.get("avatar"),
            "created_at": user["created_at"],
        },
    }


def register(username: str, password: str, nickname: str = None) -> dict:
    existing = get_user_by_username(username)
    if existing:
        return {"success": False, "message": "用户名已存在"}

    users = get_users()
    new_id = max([u["id"] for u in users.values()], default=0) + 1

    user_data = {
        "id": new_id,
        "username": username,
        "password_hash": _hash_password(password),
        "nickname": nickname or username,
        "avatar": None,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "preferences": {
            "default_perspective": None,
            "last_subcategory": None,
        },
        "favorites": [],
        "likes": [],
    }

    update_user(username, user_data)
    token = _generate_token(new_id, username)

    return {
        "success": True,
        "token": token,
        "user": {
            "id": new_id,
            "username": username,
            "nickname": user_data["nickname"],
            "avatar": None,
            "created_at": user_data["created_at"],
        },
    }


def get_user_info(user_id: int) -> Optional[dict]:
    users = get_users()
    for user in users.values():
        if user["id"] == user_id:
            return {
                "id": user["id"],
                "username": user["username"],
                "nickname": user["nickname"],
                "avatar": user.get("avatar"),
                "created_at": user["created_at"],
                "favorites_count": len(user.get("favorites", [])),
                "likes_count": len(user.get("likes", [])),
            }
    return None


def get_user_preferences(user_id: int) -> dict:
    users = get_users()
    for user in users.values():
        if user["id"] == user_id:
            return user.get("preferences", {})
    return {}


def update_user_preferences(user_id: int, preferences: dict) -> bool:
    users = get_users()
    for username, user in users.items():
        if user["id"] == user_id:
            user.setdefault("preferences", {}).update(preferences)
            save_users(users)
            return True
    return False


def toggle_favorite(user_id: int, content_id: int) -> dict:
    users = get_users()
    for username, user in users.items():
        if user["id"] == user_id:
            favorites = user.setdefault("favorites", [])
            if content_id in favorites:
                favorites.remove(content_id)
                is_favorited = False
            else:
                favorites.append(content_id)
                is_favorited = True
            save_users(users)
            return {"favorited": is_favorited, "count": len(favorites)}
    return {"favorited": False, "count": 0}


def toggle_like(user_id: int, content_id: int) -> dict:
    users = get_users()
    for username, user in users.items():
        if user["id"] == user_id:
            likes = user.setdefault("likes", [])
            if content_id in likes:
                likes.remove(content_id)
                is_liked = False
            else:
                likes.append(content_id)
                is_liked = True
            save_users(users)
            return {"liked": is_liked, "count": len(likes)}
    return {"liked": False, "count": 0}


def get_favorites(user_id: int) -> list:
    from app.services.data_source import get_news_by_id

    users = get_users()
    for user in users.values():
        if user["id"] == user_id:
            favorite_ids = user.get("favorites", [])
            items = []
            for cid in favorite_ids:
                news = get_news_by_id(cid)
                if news:
                    items.append(news)
            return items
    return []


def get_interaction_status(user_id: int, content_id: int) -> dict:
    users = get_users()
    for user in users.values():
        if user["id"] == user_id:
            return {
                "liked": content_id in user.get("likes", []),
                "favorited": content_id in user.get("favorites", []),
            }
    return {"liked": False, "favorited": False}


def get_user_profile(user_id: int) -> dict:
    """获取用户画像"""
    users = get_users()
    for user in users.values():
        if user["id"] == user_id:
            return user.get("profile", {})
    return {}


def update_user_profile(user_id: int, profile: dict) -> bool:
    """更新用户画像"""
    users = get_users()
    for username, user in users.items():
        if user["id"] == user_id:
            user["profile"] = profile
            save_users(users)
            return True
    return False


def get_user_circles(user_id: int) -> list:
    """获取用户所属圈层（用于反向过滤）"""
    from app.services.profile_service import identify_user_circles
    profile = get_user_profile(user_id)
    return identify_user_circles(profile)


def init_test_user():
    users = get_users()
    if "test" not in users:
        test_user = {
            "id": 1,
            "username": "test",
            "password_hash": _hash_password("test123456"),
            "nickname": "破茧者",
            "avatar": None,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "preferences": {
            "default_perspective": None,
            "last_subcategory": None,
        },
            "favorites": [],
            "likes": [],
        }
        users["test"] = test_user
        save_users(users)
    else:
        # 迁移：将旧 sha256 哈希升级为 bcrypt
        existing_hash = users["test"].get("password_hash", "")
        if not existing_hash.startswith("$2b$"):
            users["test"]["password_hash"] = _hash_password("test123456")
            save_users(users)
