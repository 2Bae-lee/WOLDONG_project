from fastapi import APIRouter, Depends
from app.models.user import User
from app.models.child import Child
from app.middleware.auth import parent_only
from app.utils.response import success

router = APIRouter(prefix="/api/home", tags=["홈화면"])


# GET /api/home - 부모 홈화면 (부모 프로필 + 아동 요약 목록 + 오늘 일정)
@router.get("")
async def get_home(user: User = Depends(parent_only)):
    # 아동 목록 조회
    children = await Child.find(Child.guardian_id == str(user.id)).to_list()

    return success({
        "guardian": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
        "children": [
            {
                "child_id": str(c.id),
                "name": c.name,
                "gender": c.gender,
                "birth_date": c.birth_date,
                "disability_type": c.disability_type,
            }
            for c in children
        ],
        "today_schedules": []  # 외출 일정 모델 만들면 채울 예정
    })