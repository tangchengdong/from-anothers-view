from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import perspectives, feed, content, auth, user
from app.services.auth_service import init_test_user
from app.services.rss_service import refresh_cache_async, get_cache_info

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


@app.on_event("startup")
async def startup_event():
    init_test_user()
    # 启动时后台预加载 RSS 缓存（不阻塞启动）
    import asyncio
    asyncio.create_task(refresh_cache_async())


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


@app.get("/")
async def root():
    return {
        "name": "换个视角看世界",
        "version": "1.0.0",
        "docs": "/docs",
    }
