from fastapi import APIRouter, Query
from typing import List, Optional
from app.services.data_source import get_news_by_id
from app.services.search_service import search_all, search_with_perspectives
from app.services.feed_service import get_perspective_feed

router = APIRouter(prefix="/api/content", tags=["内容"])


@router.get("/search")
async def search_content(
    q: str = Query(..., description="搜索关键词"),
    perspective: str = Query(None, description="指定视角搜索（角色名）"),
    limit: int = Query(20, ge=1, le=100),
    perspectives: Optional[str] = Query(None, description="视角角色名列表，逗号分隔"),
):
    perspective_list = None
    if perspectives:
        perspective_list = [p.strip() for p in perspectives.split(",") if p.strip()]

    if perspective:
        all_results = search_all(q, limit=limit)
        result = {
            "query": q,
            "results": all_results,
            "commentaries": [],
            "by_perspective": {},
            "total": len(all_results),
            "is_simulated": any(r.get("simulated") for r in all_results),
            "perspectives": [perspective],
        }
        agent_result = await get_perspective_feed(perspective, limit)
        result["results"] = agent_result.get("items", all_results)
        return result

    result = search_with_perspectives(q, limit, perspectives=perspective_list)
    return result


@router.get("/related/{content_id}")
async def get_related(
    content_id: int,
    perspective: str = Query("AI研究员", description="视角角色名"),
    limit: int = 3,
):
    result = await get_perspective_feed(perspective, limit + 1)
    items = [item for item in result.get("items", []) if item["id"] != content_id]
    return {"data": items[:limit]}


@router.get("/{content_id}")
async def get_content(content_id: int):
    news = get_news_by_id(content_id)
    if not news:
        return {"data": None, "message": "内容不存在"}
    return {"data": news}
