"""pytest 公共 fixture"""
import sys
import json
import os
from pathlib import Path

# 确保 backend 目录在 sys.path 中
BACKEND_DIR = Path(__file__).parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import pytest


@pytest.fixture
def tmp_users_json(tmp_path, monkeypatch):
    """临时 users.json，避免污染真实数据"""
    tmp_file = tmp_path / "users.json"
    tmp_file.write_text("{}", encoding="utf-8")
    # monkeypatch data_source 模块的 USERS_FILE 常量
    from app.services import data_source
    monkeypatch.setattr(data_source, "USERS_FILE", tmp_file)
    return tmp_file


@pytest.fixture
def client():
    """FastAPI TestClient"""
    from fastapi.testclient import TestClient
    from app.main import app
    return TestClient(app)
