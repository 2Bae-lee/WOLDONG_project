from beanie import Document
from pydantic import EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class Role(str, Enum):
    parent = "parent"        # 보호자
    companion = "companion"  # 동행인

class User(Document):
    name: str
    email: EmailStr
    password: str            # 해시된 비밀번호
    role: Role
    phone: Optional[str] = None
    created_at: datetime = datetime.now()

    class Settings:
        name = "users"       # MongoDB 컬렉션 이름
