from fastapi import APIRouter, Depends
from datetime import datetime
import random

from app.models.user import User
from app.models.child import Child
from app.models.invite import InviteCode, CompanionRequest, RequestStatus
from app.middleware.auth import parent_only, companion_only
from app.utils.response import success, error
from beanie import PydanticObjectId
from app.models.notification import Notification, NotificationType

router = APIRouter(prefix="/api/invite", tags=["초대코드"])


# POST /api/invite/generate - 초대코드 생성 (부모 전용)
@router.post("/generate")
async def generate_invite(child_id: str, user: User = Depends(parent_only)):
    # 아동 존재 확인 + 본인 아동인지 확인
    try:
        oid = PydanticObjectId(child_id)
    except Exception:
        return error("유효하지 않은 child_id입니다", 400)

    child = await Child.get(oid)
    if not child:
        return error("아동 프로필을 찾을 수 없습니다", 404)
    if child.guardian_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

    # 기존 미사용 코드 삭제
    await InviteCode.find(
        InviteCode.child_id == child_id,
        InviteCode.is_used == False
    ).delete()

    # 4자리 숫자 코드 생성
    code = str(random.randint(1000, 9999))

    invite = InviteCode(
        code=code,
        child_id=child_id,
        guardian_id=str(user.id),
    )
    await invite.insert()

    return success({
        "code": code,
        "expires_at": str(invite.expires_at)
    }, "초대코드가 생성되었습니다", 201)


# POST /api/invite/verify - 코드 검증 + 승인 요청 (동행인 전용)
@router.post("/verify")
async def verify_invite(code: str, user: User = Depends(companion_only)):
    invite = await InviteCode.find_one(InviteCode.code == code)

    # 유효성 검증
    if not invite:
        return error("존재하지 않는 초대코드입니다", 404)
    if invite.is_used:
        return error("이미 사용된 초대코드입니다", 400)
    if datetime.utcnow() > invite.expires_at:
        return error("만료된 초대코드입니다", 400)

    # 이미 요청했는지 확인
    existing = await CompanionRequest.find_one(
        CompanionRequest.companion_id == str(user.id),
        CompanionRequest.child_id == invite.child_id,
        CompanionRequest.status == RequestStatus.pending
    )
    if existing:
        return error("이미 승인 요청 중입니다", 400)

    # 승인 요청 생성
    request = CompanionRequest(
        companion_id=str(user.id),
        companion_name=user.name,
        child_id=invite.child_id,
        guardian_id=invite.guardian_id,
    )
    await request.insert()

    return success(None, "부모에게 승인 요청을 보냈습니다. 승인 대기 중입니다")


# GET /api/invite/requests - 승인 대기 목록 조회 (부모 전용)
@router.get("/requests")
async def get_requests(user: User = Depends(parent_only)):
    requests = await CompanionRequest.find(
        CompanionRequest.guardian_id == str(user.id),
        CompanionRequest.status == RequestStatus.pending
    ).to_list()

    return success([
        {
            "request_id": str(r.id),
            "companion_name": r.companion_name,
            "child_id": r.child_id,
            "created_at": str(r.created_at)
        }
        for r in requests
    ])


# POST /api/invite/approve - 승인/거절 (부모 전용)
@router.post("/approve")
async def approve_request(
    request_id: str,
    approve: bool,
    user: User = Depends(parent_only)
):
    try:
        oid = PydanticObjectId(request_id)
    except Exception:
        return error("유효하지 않은 request_id입니다", 400)

    req = await CompanionRequest.get(oid)
    if not req:
        return error("요청을 찾을 수 없습니다", 404)
    if req.guardian_id != str(user.id):
        return error("접근 권한이 없습니다", 403)
    if req.status != RequestStatus.pending:
        return error("이미 처리된 요청입니다", 400)

    if approve:
        req.status = RequestStatus.approved
        await req.save()

        # 초대코드 사용 처리
        invite = await InviteCode.find_one(InviteCode.child_id == req.child_id)
        if invite:
            invite.is_used = True
            await invite.save()

        # 동행인한테 승인 알림 저장
        await Notification(
            recipient_id=req.companion_id,
            sender_name=user.name,
            type=NotificationType.request_approved,
            message=f"{user.name}님이 아동 연결 요청을 승인했습니다.",
            child_id=req.child_id,
        ).insert()
   

        return success(None, "동행인 승인이 완료되었습니다")
    else:
        req.status = RequestStatus.rejected
        await req.save()

        # 동행인한테 거절 알림 저장
        await Notification(
            recipient_id=req.companion_id,
            sender_name=user.name,
            type=NotificationType.request_rejected,
            message=f"{user.name}님이 아동 연결 요청을 거절했습니다.",
            child_id=req.child_id,
        ).insert()

        return success(None, "동행인 요청을 거절했습니다")
    
# GET /api/invite/companions/{child_id} - 아동별 연동된 동행인 목록 조회 (부모 전용)
@router.get("/companions/{child_id}")
async def get_companions(child_id: str, user: User = Depends(parent_only)):
    try:
        oid = PydanticObjectId(child_id)
    except Exception:
        return error("유효하지 않은 child_id입니다", 400)

    child = await Child.get(oid)
    if not child:
        return error("아동 프로필을 찾을 수 없습니다", 404)
    if child.guardian_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

    companions = await CompanionRequest.find(
        CompanionRequest.child_id == child_id,
        CompanionRequest.status == RequestStatus.approved
    ).to_list()

    return success([
        {
            "request_id": str(c.id),
            "companion_id": c.companion_id,
            "companion_name": c.companion_name,
            "created_at": str(c.created_at)
        }
        for c in companions
    ])


# DELETE /api/invite/companions/{child_id}/{companion_id} - 동행인 권한 철회 (부모 전용)
@router.delete("/companions/{child_id}/{companion_id}")
async def delete_companion(child_id: str, companion_id: str, user: User = Depends(parent_only)):
    try:
        oid = PydanticObjectId(child_id)
    except Exception:
        return error("유효하지 않은 child_id입니다", 400)

    child = await Child.get(oid)
    if not child:
        return error("아동 프로필을 찾을 수 없습니다", 404)
    if child.guardian_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

    companion = await CompanionRequest.find_one(
        CompanionRequest.child_id == child_id,
        CompanionRequest.companion_id == companion_id,
        CompanionRequest.status == RequestStatus.approved
    )
    if not companion:
        return error("연동된 동행인을 찾을 수 없습니다", 404)

    await companion.delete()

    return success(None, "동행인 권한이 철회되었습니다")