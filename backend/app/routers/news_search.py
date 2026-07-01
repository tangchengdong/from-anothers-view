"""
新闻搜索 API
- /api/news/search — 从缓存池搜索
- /api/news/autonomous — Agent 自主搜索（实时 RSS + LLM 策略 + 缓存池）
- /api/news/stream — 流式缓存池搜索
- /api/news/stream-autonomous — 流式自主搜索
"""
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Optional
import json
import logging

from app.agents import NewsSearchAgent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/news", tags=["新闻搜索"])


@router.get("/search")
async def search_news(
    perspective: str = Query(..., description="视角角色名称"),
    q: Optional[str] = Query(None, description="搜索关键词"),
    limit: int = Query(10, ge=1, le=30),
    category: Optional[str] = Query(None),
    use_llm: bool = Query(True),
):
    """从缓存池搜索新闻（快速）"""
    try:
        agent = NewsSearchAgent(perspective)
        return await agent.search_news(
            query=q, limit=limit, category=category, use_llm_annotate=use_llm
        )
    except Exception as e:
        logger.error("新闻搜索失败 [%s]: %s", perspective, e, exc_info=True)
        return JSONResponse(
            status_code=200,
            content={"perspective": perspective, "items": [], "total_pool": 0, "filtered_count": 0, "error": str(e)},
        )


@router.get("/autonomous")
async def autonomous_search(
    perspective: str = Query(..., description="视角角色名称"),
    keywords: Optional[str] = Query(None, description="搜索关键词（逗号分隔），为空时 Agent 自主决定"),
    limit: int = Query(10, ge=1, le=30),
    use_llm_strategy: bool = Query(True, description="是否用 LLM 生成搜索策略"),
    use_llm_annotate: bool = Query(True),
):
    """Agent 自主搜索新闻

    - 如果不提供 keywords，Agent 会用 LLM 分析角色兴趣，自主生成搜索策略
    - 实时从 RSS 源抓取最新数据（不依赖缓存）
    - 搜索结果存入新闻池供其他模块使用
    """
    try:
        agent = NewsSearchAgent(perspective)
        kw_list = [k.strip() for k in keywords.split(",") if k.strip()] if keywords else None
        return await agent.autonomous_search(
            keywords=kw_list, limit=limit,
            use_llm_strategy=use_llm_strategy, use_llm_annotate=use_llm_annotate,
        )
    except Exception as e:
        logger.error("自主搜索失败 [%s]: %s", perspective, e, exc_info=True)
        return JSONResponse(
            status_code=200,
            content={"perspective": perspective, "items": [], "total_found": 0, "filtered_count": 0, "error": str(e)},
        )


@router.get("/stream")
async def stream_search_news(
    perspective: str = Query(...),
    q: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=30),
    category: Optional[str] = Query(None),
    use_llm: bool = Query(True),
):
    """SSE 流式缓存池搜索"""

    async def event_generator():
        try:
            agent = NewsSearchAgent(perspective)
            async for evt in agent.stream_search(
                query=q, limit=limit, category=category, use_llm_annotate=use_llm
            ):
                yield f"data: {json.dumps(evt, ensure_ascii=False)}\n\n"
        except Exception as e:
            logger.error("流式搜索失败 [%s]: %s", perspective, e, exc_info=True)
            error_evt = {"event": "error", "message": str(e)}
            yield f"data: {json.dumps(error_evt, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/stream-autonomous")
async def stream_autonomous_search(
    perspective: str = Query(...),
    keywords: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=30),
    use_llm_strategy: bool = Query(True),
    use_llm_annotate: bool = Query(True),
):
    """SSE 流式自主搜索（Agent 自主决定搜什么）"""

    async def event_generator():
        try:
            agent = NewsSearchAgent(perspective)
            kw_list = [k.strip() for k in keywords.split(",") if k.strip()] if keywords else None
            async for evt in agent.stream_autonomous_search(
                keywords=kw_list, limit=limit,
                use_llm_strategy=use_llm_strategy, use_llm_annotate=use_llm_annotate,
            ):
                yield f"data: {json.dumps(evt, ensure_ascii=False)}\n\n"
        except Exception as e:
            logger.error("流式自主搜索失败 [%s]: %s", perspective, e, exc_info=True)
            error_evt = {"event": "error", "message": str(e)}
            yield f"data: {json.dumps(error_evt, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
