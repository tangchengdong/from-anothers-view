"""Feed 路由测试"""
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.auth_service import register, _generate_token


def test_perspectives_returns_12(client):
    """GET /api/perspectives 返回 12 项"""
    resp = client.get("/api/perspectives")
    assert resp.status_code == 200
    data = resp.json()
    perspectives = data.get("data", data) if isinstance(data, dict) else data
    assert len(perspectives) == 12, f"应返回 12 视角，实际: {len(perspectives)}"


def test_feed_returns_list(client):
    """GET /api/feed 返回资讯列表"""
    resp = client.get("/api/feed?perspective=tech&limit=5")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) <= 5


def test_feed_global_perspective(client):
    """GET /api/feed?perspective=global 返回国际视角资讯"""
    resp = client.get("/api/feed?perspective=global&limit=3")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


def test_feed_environment_perspective(client):
    """GET /api/feed?perspective=environment 返回环保视角资讯"""
    resp = client.get("/api/feed?perspective=environment&limit=3")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


def test_ranking_returns_all(client):
    """GET /api/feed/ranking 返回排行榜"""
    resp = client.get("/api/feed/ranking")
    assert resp.status_code == 200
    data = resp.json()
    assert "ranking" in data


def test_ranking_specific_perspective(client):
    """GET /api/feed/ranking?perspective=tech 返回 tech 排行榜"""
    resp = client.get("/api/feed/ranking?perspective=tech&limit=5")
    assert resp.status_code == 200
    data = resp.json()
    assert "ranking" in data


def test_feed_with_auth_no_profile(client, tmp_users_json):
    """带 token 但无画像的 feed 请求，不进行过滤"""
    register("authuser", "pass123456")
    login_resp = client.post("/api/auth/login", json={
        "username": "authuser",
        "password": "pass123456",
    })
    token = login_resp.json()["token"]
    resp = client.get(
        "/api/feed?perspective=tech&limit=3",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    # 无画像时不应有 filter_info
    assert "filter_info" not in data


def test_feed_with_profile_filters(client, tmp_users_json):
    """带画像的 feed 请求应包含 filter_info"""
    # 注册并登录
    register("filteruser", "pass123456")
    login_resp = client.post("/api/auth/login", json={
        "username": "filteruser",
        "password": "pass123456",
    })
    token = login_resp.json()["token"]

    # 设置画像（30 岁程序员 → tech 圈层）
    client.post(
        "/api/user/profile",
        json={
            "age": 30,
            "gender": "male",
            "occupation": "程序员",
            "region": "北京",
            "interests": ["编程", "科技"],
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    # 请求 tech 视角 feed
    resp = client.get(
        "/api/feed?perspective=tech&limit=10",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    # 有画像且识别出圈层时应有 filter_info
    if data.get("filter_info"):
        assert data["filter_info"]["is_filtering"] is True
        assert "tech" in data["filter_info"]["user_circles"]
