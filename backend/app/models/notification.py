from beanie import Document
from pydantic import Field
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    companion_request = "companion_request"   # 동행인 연결 요청 (부모한테)
    request_approved = "request_approved"     # 승인 완료 (동행인한테)
    request_rejected = "request_rejected"     # 거절 (동행인한테)
    emergency = "emergency"                   # 돌발상황 (부모한테)


class Notification(Document):
    recipient_id: str                         # 알림 받는 사람 ID
    sender_name: str                          # 알림 보낸 사람 이름
    type: NotificationType
    message: str
    child_id: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"