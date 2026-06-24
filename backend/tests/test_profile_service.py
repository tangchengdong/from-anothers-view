"""用户画像服务测试"""
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.profile_service import (
    identify_user_circles,
    _calculate_circle_relevance,
    filter_out_user_circles,
    get_filter_summary,
    get_circle_names,
)


def test_identify_circles_programmer():
    """30 岁男性程序员 → 识别出 tech 圈层"""
    profile = {
        "age": 30,
        "gender": "male",
        "occupation": "程序员",
        "region": "北京",
        "interests": ["编程", "科技"],
    }
    circles = identify_user_circles(profile)
    assert "tech" in circles, f"程序员应识别出 tech 圈层，实际: {circles}"


def test_identify_circles_empty_profile():
    """空画像返回空圈层"""
    assert identify_user_circles({}) == []
    assert identify_user_circles(None) == []


def test_identify_circles_elderly():
    """65 岁老人识别出 elderly 圈层"""
    profile = {"age": 65, "gender": "male", "occupation": "退休", "interests": ["养生"]}
    circles = identify_user_circles(profile)
    assert "elderly" in circles
    assert "parent" in circles  # 退休职业映射到 parent


def test_identify_circles_genz():
    """20 岁年轻人识别出 genz 圈层"""
    profile = {"age": 20, "interests": ["游戏", "动漫"]}
    circles = identify_user_circles(profile)
    assert "genz" in circles


def test_filter_out_user_circles():
    """同圈层高相关度内容被过滤"""
    user_circles = ["tech"]
    news_list = [
        {
            "id": 1,
            "title": "AI 大模型新突破",
            "perspective_id": "tech",
            "tags": ["科技", "AI", "编程"],
            "category": "AI技术",
        },
        {
            "id": 2,
            "title": "乡村教育新政策",
            "perspective_id": "rural",
            "tags": ["乡村", "教育"],
            "category": "乡村教育",
        },
        {
            "id": 3,
            "title": "无相关视角的资讯",
            "perspective_id": "",
            "tags": [],
            "category": "综合",
        },
    ]
    filtered = filter_out_user_circles(news_list, user_circles, threshold=0.7)
    # tech 资讯相关度高应被屏蔽，rural 和无视角的保留
    ids = [n["id"] for n in filtered]
    assert 2 in ids, "rural 资讯应保留"
    assert 3 in ids, "无视角资讯应保留"


def test_filter_no_circles_returns_all():
    """无圈层时不过滤，返回全部"""
    news_list = [{"id": 1, "perspective_id": "tech"}]
    filtered = filter_out_user_circles(news_list, [], threshold=0.7)
    assert len(filtered) == 1


def test_filter_summary():
    """过滤摘要信息正确"""
    summary = get_filter_summary(10, 7, ["tech", "genz"])
    assert summary["original_count"] == 10
    assert summary["filtered_count"] == 7
    assert summary["shielded_count"] == 3
    assert summary["is_filtering"] is True
    assert "tech" in summary["user_circles"]


def test_circle_names():
    """圈层 ID 转可读名称"""
    names = get_circle_names(["tech", "lgbtq", "global"])
    assert "科技控" in names
    assert "酷儿视角" in names
    assert "国际视角" in names


def test_calculate_relevance_no_perspective():
    """无视角资讯相关度为 0"""
    news = {"perspective_id": ""}
    assert _calculate_circle_relevance(news, ["tech"]) == 0.0


def test_calculate_relevance_not_in_circles():
    """资讯视角不在用户圈层中，相关度为 0"""
    news = {"perspective_id": "rural", "tags": [], "category": ""}
    assert _calculate_circle_relevance(news, ["tech"]) == 0.0
