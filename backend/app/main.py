from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import perspectives, feed, content, auth, user, commentary, news_search
from app.services.auth_service import init_test_user
from app.services.rss_service import refresh_cache_async, get_cache_info
from app.agents import init_agents_cache, start_auto_search

app = FastAPI(
    title="换个视角看世界 - API",
    description="AI驱动的跨圈层资讯获取器",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(perspectives.router)
app.include_router(feed.router)
app.include_router(content.router)
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(commentary.router)
app.include_router(news_search.router)


@app.on_event("startup")
async def startup_event():
    init_test_user()
    # 内存预初始化角色 Agent 池（一次构建，多次复用，加快首次请求）
    init_agents_cache()
    import asyncio
    # 启动时后台预加载 RSS 缓存（不阻塞启动）
    asyncio.create_task(refresh_cache_async())
    # 启动时后台预加载 MCP 新闻缓存
    try:
        from app.services.mcp_client import refresh_mcp_cache_async, is_mcp_available
        if is_mcp_available():
            asyncio.create_task(refresh_mcp_cache_async())
    except Exception:
        pass
    # 启动后台自主新闻搜索（每小时触发一次，Agent 自主搜索热点）
    try:
        start_auto_search(interval_minutes=60)
    except Exception:
        pass


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/api/rss/status")
async def rss_status():
    """获取 RSS 订阅缓存状态"""
    return get_cache_info()


@app.post("/api/rss/refresh")
async def rss_refresh():
    """手动刷新 RSS 订阅缓存"""
    count = await refresh_cache_async()
    return {"status": "ok", "refreshed": count, "cache_info": get_cache_info()}


@app.get("/api/mcp/status")
async def mcp_status():
    """获取 MCP 新闻缓存状态"""
    try:
        from app.services.mcp_client import get_mcp_status
        return get_mcp_status()
    except Exception:
        return {"enabled": False, "error": "mcp_client module not available"}


@app.post("/api/mcp/refresh")
async def mcp_refresh():
    """手动刷新 MCP 新闻缓存"""
    try:
        from app.services.mcp_client import refresh_mcp_cache_async
        count = await refresh_mcp_cache_async()
        return {"status": "ok", "refreshed": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/")
async def root():
    return {
        "name": "换个视角看世界",
        "version": "1.0.0",
        "docs": "/docs",
    }
