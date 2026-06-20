from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from beanie import PydanticObjectId

from app.models.user import User
from app.middleware.auth import parent_only
from app.utils.response import success, error
from app.models.child import (
    Child, GenderEnum, RelationEnum, DisabilityTypeEnum,
    EXPLANATION_STYLES, COMMUNICATION_STYLES, CAUTION_SITUATIONS,
    DIFFICULT_ENVIRONMENTS, DIFFICULT_PLACES, TRANSITION_DIFFICULTIES,
    NOTICE_TIMES, CALMING_METHODS
)

router = APIRouter(prefix="/api/children", tags=["아동 프로필"])


# ─── 요청 스키마 ────────────────────────────────────────
class ChildCreateRequest(BaseModel):
    # 1단계
    name: str
    gender: GenderEnum
    birth_date: date
    guardian_relation: RelationEnum
    # 2단계
    disability_type: DisabilityTypeEnum
    # 3단계
    explanation_styles: list[str] = []
    communication_styles: list[str] = []
    # 4단계
    caution_situations: list[str] = []
    required_actions: str = ""
    # 5단계
    difficult_environments: list[str] = []
    difficult_places: list[str] = []
    # 6단계
    transition_difficulties: list[str] = []
    notice_time: str = ""
    # 7단계
    calming_methods: list[str] = []
    avoid_behaviors: str = ""

    class Config:
        json_schema_extra = {
            "example": {
                "name": "김월동",
                "gender": "여자아이",
                "birth_date": "2020-03-15",
                "guardian_relation": "주양육자",
                "disability_type": "자폐스펙트럼장애",
                "explanation_styles": ["한번에 하나씩 말해줘야해요", "반복 설명이 필요해요"],
                "communication_styles": ["네/아니오로 대답해요"],
                "caution_situations": ["갑자기 뛰어갈 수 있어요"],
                "required_actions": "손을 꼭 잡고 이동해주세요",
                "difficult_environments": ["큰 소리", "밝은 빛"],
                "difficult_places": ["지하철", "마트"],
                "transition_difficulties": ["기다리기", "하던 활동 멈추기"],
                "notice_time": "10분 전",
                "calming_methods": ["좋아하는 물건", "칭찬 격려"],
                "avoid_behaviors": "큰 소리로 재촉하지 않기"
            }
        }


class ChildUpdateRequest(BaseModel):
    name: Optional[str] = None
    gender: Optional[GenderEnum] = None
    birth_date: Optional[date] = None
    guardian_relation: Optional[RelationEnum] = None
    disability_type: Optional[DisabilityTypeEnum] = None
    explanation_styles: Optional[list[str]] = None
    communication_styles: Optional[list[str]] = None
    caution_situations: Optional[list[str]] = None
    required_actions: Optional[str] = None
    difficult_environments: Optional[list[str]] = None
    difficult_places: Optional[list[str]] = None
    transition_difficulties: Optional[list[str]] = None
    notice_time: Optional[str] = None
    calming_methods: Optional[list[str]] = None
    avoid_behaviors: Optional[str] = None


# ─── 유효성 검사 ────────────────────────────────────────
def validate_fields(payload: dict):
    checks = [
        ("explanation_styles", EXPLANATION_STYLES),
        ("communication_styles", COMMUNICATION_STYLES),
        ("caution_situations", CAUTION_SITUATIONS),
        ("difficult_environments", DIFFICULT_ENVIRONMENTS),
        ("difficult_places", DIFFICULT_PLACES),
        ("transition_difficulties", TRANSITION_DIFFICULTIES),
        ("calming_methods", CALMING_METHODS),
    ]
    for field, valid_set in checks:
        values = payload.get(field, [])
        if values:
            invalid = [v for v in values if v not in valid_set]
            if invalid:
                return error(f"유효하지 않은 {field} 값: {invalid}", 422)
    if "notice_time" in payload and payload["notice_time"]:
        if payload["notice_time"] not in NOTICE_TIMES:
            return error(f"유효하지 않은 notice_time 값입니다", 422)
    return None


# ─── 라우트 ────────────────────────────────────────────

# POST /api/children
@router.post("")
async def create_child(body: ChildCreateRequest, user: User = Depends(parent_only)):
    payload = body.model_dump()
    err = validate_fields(payload)
    if err:
        return err

    child = Child(
        guardian_id=str(user.id),
        name=body.name,
        gender=body.gender,
        birth_date=body.birth_date.isoformat(),
        guardian_relation=body.guardian_relation,
        disability_type=body.disability_type,
        explanation_styles=body.explanation_styles,
        communication_styles=body.communication_styles,
        caution_situations=body.caution_situations,
        required_actions=body.required_actions,
        difficult_environments=body.difficult_environments,
        difficult_places=body.difficult_places,
        transition_difficulties=body.transition_difficulties,
        notice_time=body.notice_time,
        calming_methods=body.calming_methods,
        avoid_behaviors=body.avoid_behaviors,
    )
    await child.insert()

    return success({
        "child_id": str(child.id),
        "name": child.name,
        "created_at": str(child.created_at)
    }, "아동 프로필이 등록되었습니다", 201)


# GET /api/children
@router.get("")
async def get_my_children(user: User = Depends(parent_only)):
    children = await Child.find(Child.guardian_id == str(user.id)).to_list()
    return success([
        {
            "child_id": str(c.id),
            "name": c.name,
            "gender": c.gender,
            "birth_date": c.birth_date,
            "disability_type": c.disability_type,
        }
        for c in children
    ])


# GET /api/children/{child_id}
@router.get("/{child_id}")
async def get_child(child_id: str, user: User = Depends(parent_only)):
    try:
        oid = PydanticObjectId(child_id)
    except Exception:
        return error("유효하지 않은 child_id입니다", 400)

    child = await Child.get(oid)
    if not child:
        return error("아동 프로필을 찾을 수 없습니다", 404)
    if child.guardian_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

    return success({
        "child_id": str(child.id),
        "name": child.name,
        "gender": child.gender,
        "birth_date": child.birth_date,
        "guardian_relation": child.guardian_relation,
        "disability_type": child.disability_type,
        "explanation_styles": child.explanation_styles,
        "communication_styles": child.communication_styles,
        "caution_situations": child.caution_situations,
        "required_actions": child.required_actions,
        "difficult_environments": child.difficult_environments,
        "difficult_places": child.difficult_places,
        "transition_difficulties": child.transition_difficulties,
        "notice_time": child.notice_time,
        "calming_methods": child.calming_methods,
        "avoid_behaviors": child.avoid_behaviors,
        "created_at": str(child.created_at),
        "updated_at": str(child.updated_at),
    })


# PATCH /api/children/{child_id}
@router.patch("/{child_id}")
async def update_child(child_id: str, body: ChildUpdateRequest, user: User = Depends(parent_only)):
    try:
        oid = PydanticObjectId(child_id)
    except Exception:
        return error("유효하지 않은 child_id입니다", 400)

    child = await Child.get(oid)
    if not child:
        return error("아동 프로필을 찾을 수 없습니다", 404)
    if child.guardian_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

    update_data = body.model_dump(exclude_none=True)
    err = validate_fields(update_data)
    if err:
        return err

    if "birth_date" in update_data:
        update_data["birth_date"] = update_data["birth_date"].isoformat()
    update_data["updated_at"] = datetime.utcnow()

    await child.set(update_data)
    return success(None, "아동 프로필이 수정되었습니다")


# DELETE /api/children/{child_id}
@router.delete("/{child_id}")
async def delete_child(child_id: str, user: User = Depends(parent_only)):
    try:
        oid = PydanticObjectId(child_id)
    except Exception:
        return error("유효하지 않은 child_id입니다", 400)

    child = await Child.get(oid)
    if not child:
        return error("아동 프로필을 찾을 수 없습니다", 404)
    if child.guardian_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

    await child.delete()
    return success(None, "아동 프로필이 삭제되었습니다")