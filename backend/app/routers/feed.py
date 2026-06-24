from fastapi import APIRouter, Query, Header
from typing import Optional
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
from app.services.feed_service import get_perspective_feed, stream_perspective_feed
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
