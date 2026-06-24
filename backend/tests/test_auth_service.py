"""认证服务测试"""
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.auth_service import (
    _hash_password,
    _verify_password,
    register,
    login,
    init_test_user,
)


def test_bcrypt_password():
    """密码哈希以 $2b$ 开头，verify 正确/错误密码"""
    hashed = _hash_password("mypassword")
    assert hashed.startswith("$2b$"), f"bcrypt 哈希应以 $2b$ 开头，实际: {hashed[:4]}"
    assert _verify_password("mypassword", hashed) is True
    assert _verify_password("wrongpassword", hashed) is False


def test_register_and_login(tmp_users_json):
    """注册新用户 → 登录成功 → 返回 JWT"""
    result = register("newuser", "pass123456", nickname="测试用户")
    assert result["success"] is True
    assert "token" in result
    assert result["user"]["username"] == "newuser"
    assert result["user"]["nickname"] == "测试用户"

    login_result = login("newuser", "pass123456")
    assert login_result["success"] is True
    assert "token" in login_result
    assert login_result["user"]["username"] == "newuser"


def test_login_wrong_password(tmp_users_json):
    """错误密码登录失败"""
    register("user2", "correctpass")
    result = login("user2", "wrongpass")
    assert result["success"] is False
    assert "密码错误" in result["message"]


def test_login_nonexistent_user(tmp_users_json):
    """不存在用户登录失败"""
    result = login("ghost", "anything")
    assert result["success"] is False
    assert "用户不存在" in result["message"]


def test_duplicate_register(tmp_users_json):
    """重复用户名注册失败"""
    register("dup", "pass123456")
    result = register("dup", "anotherpass")
    assert result["success"] is False
    assert "已存在" in result["message"]


def test_init_test_user(tmp_users_json):
    """init_test_user 创建 test 用户且可登录"""
    init_test_user()
    login_result = login("test", "test123456")
    assert login_result["success"] is True
    assert login_result["user"]["nickname"] == "破茧者"


def test_init_test_user_migrates_sha256(tmp_users_json):
    """init_test_user 将旧 sha256 哈希迁移为 bcrypt"""
    import hashlib
    import json
    # 手动写入旧 sha256 哈希
    from app.services import data_source
    users = {"test": {
        "id": 1,
        "username": "test",
        "password_hash": hashlib.sha256("test123456".encode()).hexdigest(),
        "nickname": "破茧者",
        "created_at": "2026-01-01",
        "preferences": {},
        "favorites": [],
        "likes": [],
    }}
    data_source.save_users(users)

    init_test_user()

    # 验证哈希已迁移为 bcrypt
    users_after = data_source.get_users()
    assert users_after["test"]["password_hash"].startswith("$2b$"), "sha256 应迁移为 bcrypt"

    # 验证仍可登录
    login_result = login("test", "test123456")
    assert login_result["success"] is True
