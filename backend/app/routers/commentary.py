"""
视角评论 API
- 为单条新闻生成指定视角的评论（短评/深度）
- 批量多视角评论
- 流式评论
- 控制 token 用量，避免大规模调用
"""
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from fastapi.responses import StreamingResponse
import asyncio
import json
from app.services.llm_service import llm
from app.services.data_source import get_news_by_id
from app.agents import get_agent

router = APIRouter(prefix="/api/commentary", tags=["评论"])


class BatchRequest(BaseModel):
    news_id: int
    perspectives: List[str]


def _get_perspective_info(perspective_name: str) -> Optional[dict]:
    """获取视角信息，不存在则返回 None"""
    agent = get_agent(perspective_name)
    if not agent:
        return None
    return {
        "role_name": agent.role_name,
        "emoji": agent._get_emoji(),
        "perspective_id": agent.perspective_id,
    }


@router.get("/generate")
async def generate_commentary(
    news_id: int = Query(..., description="新闻ID"),
    perspective: str = Query(..., description="视角角色名称"),
):
    """为单条新闻生成指定视角的短评论（1-2句，80字内）"""
    news = get_news_by_id(news_id)
    if not news:
        raise HTTPException(status_code=404, detail="新闻不存在")

    perspective_info = _get_perspective_info(perspective)
    if not perspective_info:
        raise HTTPException(status_code=404, detail=f"视角 '{perspective}' 不存在")

    try:
        commentary = await llm.generate_insight(news, perspective_info)
        return {
            "news_id": news_id,
            "news_title": news.get("title", ""),
            "perspective": perspective,
            "perspective_info": perspective_info,
            "commentary": commentary,
            "model": llm.model if llm.enabled else "fallback",
            "is_llm_generated": llm.enabled,
        }
    except Exception as e:
        fallback = llm._fallback_insight(news, perspective_info)
        return {
            "news_id": news_id,
            "news_title": news.get("title", ""),
            "perspective": perspective,
            "perspective_info": perspective_info,
            "commentary": fallback,
            "model": "fallback",
            "is_llm_generated": False,
            "error": str(e),
        }


@router.get("/deep")
async def generate_deep_commentary(
    news_id: int = Query(..., description="新闻ID"),
    perspective: str = Query(..., description="视角角色名称"),
):
    """为单条新闻生成指定视角的深度评论（200-300字）"""
    news = get_news_by_id(news_id)
    if not news:
        raise HTTPException(status_code=404, detail="新闻不存在")

    perspective_info = _get_perspective_info(perspective)
    if not perspective_info:
        raise HTTPException(status_code=404, detail=f"视角 '{perspective}' 不存在")

    try:
        # 同时生成短评和深度评论（短评有缓存优先用缓存）
        short_commentary = await llm.generate_insight(news, perspective_info)
        deep_commentary = await llm.generate_deep_insight(news, perspective_info)
        return {
            "news_id": news_id,
            "news_title": news.get("title", ""),
            "perspective": perspective,
            "perspective_info": perspective_info,
            "short_commentary": short_commentary,
            "deep_commentary": deep_commentary,
            "model": llm.model if llm.enabled else "fallback",
            "is_llm_generated": llm.enabled,
        }
    except Exception as e:
        fallback_short = llm._fallback_insight(news, perspective_info)
        fallback_deep = llm._fallback_deep_insight(news, perspective_info)
        return {
            "news_id": news_id,
            "news_title": news.get("title", ""),
            "perspective": perspective,
            "perspective_info": perspective_info,
            "short_commentary": fallback_short,
            "deep_commentary": fallback_deep,
            "model": "fallback",
            "is_llm_generated": False,
            "error": str(e),
        }


@router.post("/batch")
async def generate_batch_commentary(req: BatchRequest):
    """为一条新闻批量生成多个视角的短评论。

    限制：单次最多 5 个视角，控制 token 用量。
    所有视角并行异步请求，互不阻塞。
    """
    if len(req.perspectives) > 5:
        raise HTTPException(status_code=400, detail="单次最多5个视角")
    if len(req.perspectives) == 0:
        raise HTTPException(status_code=400, detail="至少需要1个视角")

    news = get_news_by_id(req.news_id)
    if not news:
        raise HTTPException(status_code=404, detail="新闻不存在")

    # 为每个视角构建任务（并行执行，互不等待）
    async def _gen_one(perspective_name: str) -> tuple:
        perspective_info = _get_perspective_info(perspective_name)
        if not perspective_info:
            return perspective_name, f"视角 '{perspective_name}' 不存在"
        try:
            commentary = await llm.generate_insight(news, perspective_info)
            return perspective_name, commentary
        except Exception:
            return perspective_name, llm._fallback_insight(news, perspective_info)

    # 并行调度所有视角
    results = await asyncio.gather(
        *[_gen_one(name) for name in req.perspectives],
        return_exceptions=False,
    )
    opinions = {name: text for name, text in results}

    return {
        "news_id": req.news_id,
        "news_title": news.get("title", ""),
        "opinions": opinions,
        "model": llm.model if llm.enabled else "fallback",
        "is_llm_generated": llm.enabled,
    }


@router.get("/stream")
async def stream_commentary(
    news_id: int = Query(..., description="新闻ID"),
    perspective: str = Query(..., description="视角角色名称"),
    mode: str = Query("short", description="评论模式：short=短评，deep=深度"),
):
    """SSE 流式返回评论生成过程，前端可实时展示"思考中"效果"""
    news = get_news_by_id(news_id)
    if not news:
        raise HTTPException(status_code=404, detail="新闻不存在")

    perspective_info = _get_perspective_info(perspective)
    if not perspective_info:
        raise HTTPException(status_code=404, detail=f"视角 '{perspective}' 不存在")

    role = perspective_info.get("role_name", "观察者")
    title = news.get("title", "")
    summary = news.get("summary", "")

    if mode == "deep":
        messages = [
            {
                "role": "system",
                "content": f"你是一个真实的{role}，现在你正在刷手机看到一条新闻。请你用第一人称（\"我\"）发表你的深度看法，要有态度、有情绪、有立场，不要客观中立。字数200-400字。",
            },
            {
                "role": "user",
                "content": f"资讯标题：{title}\n摘要：{summary}\n\n深度解读一下你的看法。",
            },
        ]
        max_tokens = 800
    else:
        messages = [
            {
                "role": "system",
                "content": f"你是一个真实的{role}，现在你正在刷手机看到一条新闻。请你用第一人称（\"我\"）发表你的真实看法，要有态度、有情绪、有立场，不要客观中立，不要总结概括，要像真人聊天一样说出你的第一反应。2-3句话，100字以内。",
            },
            {
                "role": "user",
                "content": f"资讯标题：{title}\n摘要：{summary}\n\n你怎么看？",
            },
        ]
        max_tokens = 300

    async def event_generator():
        # 先发送 thinking 事件
        yield f"data: {json.dumps({'type': 'thinking', 'role': role}, ensure_ascii=False)}\n\n"
        await asyncio.sleep(0.3)

        # 流式生成内容
        full_content = ""
        try:
            async for chunk in llm.generate_stream(messages, max_tokens=max_tokens, temperature=0.9):
                full_content += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk}, ensure_ascii=False)}\n\n"
        except Exception:
            # 降级
            if mode == "deep":
                fallback = llm._fallback_deep_insight(news, perspective_info)
            else:
                fallback = llm._fallback_insight(news, perspective_info)
            yield f"data: {json.dumps({'type': 'chunk', 'content': fallback}, ensure_ascii=False)}\n\n"
            full_content = fallback

        # 发送完成事件
        yield f"data: {json.dumps({'type': 'done', 'content': full_content}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/status")
async def commentary_status():
    """获取评论服务状态"""
    return {
        "service": "commentary",
        "llm_status": llm.status(),
        "enabled": llm.enabled,
    }
