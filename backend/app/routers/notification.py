from fastapi import APIRouter, Depends
from beanie import PydanticObjectId

from app.models.user import User
from app.models.notification import Notification
from app.middleware.auth import get_current_user
from app.utils.response import success, error

router = APIRouter(prefix="/api/notifications", tags=["알림"])


# GET /api/notifications - 내 알림 전체 조회
@router.get("")
async def get_notifications(user: User = Depends(get_current_user)):
    notifications = await Notification.find(
        Notification.recipient_id == str(user.id)
    ).sort(-Notification.created_at).to_list()

    return success([
        {
            "notification_id": str(n.id),
            "type": n.type,
            "message": n.message,
            "sender_name": n.sender_name,
            "child_id": n.child_id,
            "is_read": n.is_read,
            "created_at": str(n.created_at)
        }
        for n in notifications
    ])


# GET /api/notifications/child/{child_id} - 특정 아동 관련 알림 피드 조회
@router.get("/child/{child_id}")
async def get_child_notifications(child_id: str, user: User = Depends(get_current_user)):
    notifications = await Notification.find(
        Notification.recipient_id == str(user.id),
        Notification.child_id == child_id
    ).sort(-Notification.created_at).to_list()

    return success([
        {
            "notification_id": str(n.id),
            "type": n.type,
            "message": n.message,
            "sender_name": n.sender_name,
            "is_read": n.is_read,
            "created_at": str(n.created_at)
        }
        for n in notifications
    ])


# PATCH /api/notifications/{notification_id}/read - 알림 읽음 처리
@router.patch("/{notification_id}/read")
async def read_notification(notification_id: str, user: User = Depends(get_current_user)):
    try:
        oid = PydanticObjectId(notification_id)
    except Exception:
        return error("유효하지 않은 notification_id입니다", 400)

    notification = await Notification.get(oid)
    if not notification:
        return error("알림을 찾을 수 없습니다", 404)
    if notification.recipient_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

    notification.is_read = True
    await notification.save()

    return success(None, "알림을 읽음 처리했습니다")