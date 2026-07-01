from fastapi import APIRouter, Query
from app.agents import get_random_perspective, _ROLE_POOL, _enrich_role
import random

router = APIRouter(prefix="/api/perspectives", tags=["视角"])


@router.get("/draw")
async def draw_perspective():
    result = get_random_perspective()
    return {"data": result}


@router.get("/suggest")
async def suggest_perspectives(count: int = Query(12, ge=4, le=20)):
    suggestions = random.sample(_ROLE_POOL, min(count, len(_ROLE_POOL)))
    enriched = [_enrich_role(r) for r in suggestions]
    return {"data": enriched}
