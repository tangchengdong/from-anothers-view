from fastapi import APIRouter, Depends, HTTPException, Header
from app.services.auth_service import (
    get_user_info,
    get_user_preferences,
    update_user_preferences,
    toggle_favorite,
    toggle_like,
    get_favorites,
    get_interaction_status,
    get_user_profile,
    update_user_profile,
    get_user_circles,
    verify_token,
)
from app.services.profile_service import (
    identify_user_circles,
    get_circle_names,
)

router = APIRouter(prefix="/api/user", tags=["用户"])


def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="未登录")
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="token无效或已过期")
    return payload


@router.get("/preferences")
async def get_preferences(current_user: dict = Depends(get_current_user)):
    prefs = get_user_preferences(current_user["user_id"])
    return {"data": prefs}


@router.put("/preferences")
async def update_preferences(
    preferences: dict,
    current_user: dict = Depends(get_current_user),
):
    success = update_user_preferences(current_user["user_id"], preferences)
    return {"success": success}


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """获取用户画像 + 圈层识别结果"""
    profile = get_user_profile(current_user["user_id"])
    circles = identify_user_circles(profile)
    circle_names = get_circle_names(circles)
    return {
        "data": profile,
        "circles": circles,
        "circle_names": circle_names,
        "has_profile": bool(profile),
    }


@router.put("/profile")
async def update_profile(
    profile: dict,
    current_user: dict = Depends(get_current_user),
):
    """更新用户画像"""
    success = update_user_profile(current_user["user_id"], profile)
    if success:
        circles = identify_user_circles(profile)
        circle_names = get_circle_names(circles)
        return {
            "success": True,
            "circles": circles,
            "circle_names": circle_names,
            "message": f"已识别您属于 {len(circles)} 个圈层，将为您屏蔽同质化内容",
        }
    return {"success": False, "message": "更新失败"}


@router.get("/circles")
async def get_circles(current_user: dict = Depends(get_current_user)):
    """获取用户圈层（用于前端展示过滤状态）"""
    circles = get_user_circles(current_user["user_id"])
    circle_names = get_circle_names(circles)
    return {
        "circles": circles,
        "circle_names": circle_names,
        "is_filtering": len(circles) > 0,
    }


@router.get("/favorites")
async def list_favorites(current_user: dict = Depends(get_current_user)):
    items = get_favorites(current_user["user_id"])
    return {"data": items, "total": len(items)}


@router.post("/favorites/{content_id}")
async def toggle_fav(
    content_id: int,
    current_user: dict = Depends(get_current_user),
):
    result = toggle_favorite(current_user["user_id"], content_id)
    return result


@router.post("/likes/{content_id}")
async def toggle_like_endpoint(
    content_id: int,
    current_user: dict = Depends(get_current_user),
):
    result = toggle_like(current_user["user_id"], content_id)
    return result


@router.get("/interactions/{content_id}")
async def get_interaction(
    content_id: int,
    current_user: dict = Depends(get_current_user),
):
    status = get_interaction_status(current_user["user_id"], content_id)
    return {"data": status}
