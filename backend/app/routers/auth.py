from fastapi import APIRouter, Depends, HTTPException, Header
from app.models.schemas import LoginRequest, UserInfo
from app.services.auth_service import login as auth_login, register as auth_register, get_user_info, verify_token

router = APIRouter(prefix="/api/auth", tags=["认证"])


def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="未登录")
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="token无效或已过期")
    return payload


@router.post("/login")
async def login_endpoint(request: LoginRequest):
    result = auth_login(request.username, request.password)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@router.post("/register")
async def register_endpoint(request: LoginRequest):
    result = auth_register(request.username, request.password, request.username)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = get_user_info(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"data": user}
