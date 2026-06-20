from beanie import Document
from pydantic import Field
from datetime import datetime, timedelta
from enum import Enum


class RequestStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class InviteCode(Document):
    code: str                          # 4자리 숫자
    child_id: str
    guardian_id: str
    expires_at: datetime = Field(
        default_factory=lambda: datetime.utcnow() + timedelta(hours=24)
    )
    is_used: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "invite_codes"


class CompanionRequest(Document):
    companion_id: str
    companion_name: str                # 부모 화면에 보여줄 동행인 이름
    child_id: str
    guardian_id: str
    status: RequestStatus = RequestStatus.pending
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "companion_requests"