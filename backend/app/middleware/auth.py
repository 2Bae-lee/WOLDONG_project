from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.jwt import decode_token
from app.models.user import User

bearer_scheme = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")

    user = await User.get(payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다")

    return user

# 보호자 전용
async def parent_only(user: User = Depends(get_current_user)) -> User:
    if user.role != "parent":
        raise HTTPException(status_code=403, detail="보호자만 접근할 수 있습니다")
    return user

# 동행인 전용
async def companion_only(user: User = Depends(get_current_user)) -> User:
    if user.role != "companion":
        raise HTTPException(status_code=403, detail="동행인만 접근할 수 있습니다")
    return user
