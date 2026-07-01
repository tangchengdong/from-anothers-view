from fastapi import APIRouter, Query, Header
from typing import Optional
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
from app.services.feed_service import get_perspective_feed, stream_perspective_feed
from app.services.data_source import get_all_news
from app.services.auth_service import verify_token

router = APIRouter(prefix="/api/feed", tags=["资讯流"])


def _try_get_user_id(authorization: str = Header(None)) -> int:
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    if payload:
        return payload.get("user_id")
    return None


@router.get("")
async def get_feed(
    perspective: str = Query(..., description="视角角色名称"),
    limit: int = Query(8, ge=1, le=30),
    category: str = Query(None, description="分类筛选"),
    authorization: str = Header(None),
):
    result = await get_perspective_feed(perspective, limit, category)
    return result


@router.get("/hot")
async def get_hot_news(
    limit: int = Query(8, ge=1, le=30, description="返回条数"),
):
    """获取热点新闻排行榜，按 views 降序排序。替代前端 getHotNewsRanking。"""
    all_news = get_all_news()
    # 按 views 降序排序，取前 limit 条
    sorted_news = sorted(all_news, key=lambda x: x.get("views", 0), reverse=True)
    items = []
    for news in sorted_news[:limit]:
        items.append({
            "id": news.get("id"),
            "title": news.get("title", ""),
            "source": news.get("source", ""),
            "views": news.get("views", 0),
            "hot": news.get("views", 0) > 100000,
            "summary": news.get("summary", ""),
            "image_url": news.get("image_url", ""),
            "category": news.get("category", ""),
            "publish_time": news.get("publish_time", ""),
        })
    return {"items": items, "total": len(items)}


@router.get("/stream")
async def stream_feed(
    perspective: str = Query(..., description="视角角色名称"),
    limit: int = Query(8, ge=1, le=30),
    category: str = Query(None, description="分类筛选"),
    authorization: str = Header(None),
):
    async def event_generator():
        async for event in stream_perspective_feed(perspective, limit, category):
            yield {
                "event": event.get("event", "message"),
                "data": json.dumps(event, ensure_ascii=False),
            }

    return EventSourceResponse(event_generator())
