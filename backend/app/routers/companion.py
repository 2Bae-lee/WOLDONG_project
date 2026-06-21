from fastapi import APIRouter, Depends
from app.models.user import User
from app.models.child import Child
from app.models.invite import CompanionRequest, RequestStatus
from app.middleware.auth import companion_only
from app.utils.response import success, error
from beanie import PydanticObjectId

router = APIRouter(prefix="/api/companion", tags=["동행인"])


# GET /api/companion/me - 동행인 프로필 조회
@router.get("/me")
async def get_companion_profile(user: User = Depends(companion_only)):
    return success({
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "phone": user.phone,
        "created_at": str(user.created_at)
    })


# GET /api/companion/children - 담당 아동 목록 전체 조회
@router.get("/children")
async def get_assigned_children(user: User = Depends(companion_only)):
    # 승인된 요청 목록 조회
    requests = await CompanionRequest.find(
        CompanionRequest.companion_id == str(user.id),
        CompanionRequest.status == RequestStatus.approved
    ).to_list()

    if not requests:
        return success([])

    # 아동 정보 조회
    children = []
    for req in requests:
        try:
            oid = PydanticObjectId(req.child_id)
            child = await Child.get(oid)
            if child:
                children.append({
                    "child_id": str(child.id),
                    "name": child.name,
                    "gender": child.gender,
                    "birth_date": child.birth_date,
                    "disability_type": child.disability_type,
                })
        except Exception:
            continue

    return success(children)