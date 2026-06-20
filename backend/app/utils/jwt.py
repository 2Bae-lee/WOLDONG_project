from datetime import datetime, timedelta
from jose import jwt, JWTError
from config.settings import settings

def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRES_DAYS)
    payload = {
        "sub": user_id,
        "role": role,
        "exp": expire
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        return None
