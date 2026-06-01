from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from beanie import PydanticObjectId
import uuid

from app.models.user import User
from app.models.child import Child
from app.models.schedule import Schedule, ScheduleStatus, ChecklistItem
from app.middleware.auth import parent_only, companion_only, get_current_user
from app.utils.response import success, error

router = APIRouter(prefix="/api/schedules", tags=["외출 일정"])


# ─── 요청 스키마 ────────────────────────────────────────
class ScheduleCreateRequest(BaseModel):
    child_id: str
    companion_id: Optional[str] = None
    title: str
    date: date
    start_time: str
    destination: str
    transport: str
    preparations: list[str] = []
    checklist: list[str] = []          # 텍스트 목록으로 받아서 ChecklistItem으로 변환

    class Config:
        json_schema_extra = {
            "example": {
                "child_id": "6651f3a2c1d2e3f4a5b6c7d8",
                "companion_id": "6651f3a2c1d2e3f4a5b6c7d9",
                "title": "병원 외출",
                "date": "2026-05-28",
                "start_time": "10:00",
                "destination": "서울대병원",
                "transport": "택시",
                "preparations": ["선글라스", "이어폰", "간식"],
                "checklist": ["10분 전 일정 알려주기", "손 잡고 이동하기"]
            }
        }


class ScheduleUpdateRequest(BaseModel):
    title: Optional[str] = None
    date: Optional[date] = None
    start_time: Optional[str] = None
    destination: Optional[str] = None
    transport: Optional[str] = None
    companion_id: Optional[str] = None
    preparations: Optional[list[str]] = None
    checklist: Optional[list[str]] = None
    status: Optional[ScheduleStatus] = None


class ChecklistUpdateRequest(BaseModel):
    item_id: str
    is_checked: bool


class JournalCreateRequest(BaseModel):
    reaction: str                      # 아이의 이동 반응
    difficulties: str                  # 어려웠던 점
    memo: Optional[str] = None         # 기타 메모


# ─── 라우트 ────────────────────────────────────────────

# POST /api/schedules - 일정 등록 (부모 전용)
@router.post("")
async def create_schedule(body: ScheduleCreateRequest, user: User = Depends(parent_only)):
    # 아동 확인
    try:
        oid = PydanticObjectId(body.child_id)
    except Exception:
        return error("유효하지 않은 child_id입니다", 400)

    child = await Child.get(oid)
    if not child:
        return error("아동 프로필을 찾을 수 없습니다", 404)
    if child.guardian_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

    # 체크리스트 텍스트 → ChecklistItem 변환
    checklist_items = [
        ChecklistItem(item_id=str(uuid.uuid4()), content=c)
        for c in body.checklist
    ]

    schedule = Schedule(
        guardian_id=str(user.id),
        child_id=body.child_id,
        companion_id=body.companion_id,
        title=body.title,
        date=body.date.isoformat(),
        start_time=body.start_time,
        destination=body.destination,
        transport=body.transport,
        preparations=body.preparations,
        checklist=checklist_items,
    )
    await schedule.insert()

    return success({
        "schedule_id": str(schedule.id),
        "title": schedule.title,
        "created_at": str(schedule.created_at)
    }, "일정이 등록되었습니다", 201)


# GET /api/schedules - 부모 일정 목록 조회
@router.get("")
async def get_schedules(user: User = Depends(parent_only)):
    schedules = await Schedule.find(
        Schedule.guardian_id == str(user.id)
    ).sort(-Schedule.date).to_list()

    return success([
        {
            "schedule_id": str(s.id),
            "title": s.title,
            "date": s.date,
            "start_time": s.start_time,
            "destination": s.destination,
            "status": s.status,
            "child_id": s.child_id,
        }
        for s in schedules
    ])


# GET /api/schedules/today - 오늘 일정 조회 (부모/동행인 공통)
@router.get("/today")
async def get_today_schedules(user: User = Depends(get_current_user)):
    today = datetime.utcnow().strftime("%Y-%m-%d")

    if user.role == "parent":
        schedules = await Schedule.find(
            Schedule.guardian_id == str(user.id),
            Schedule.date == today
        ).to_list()
    else:
        schedules = await Schedule.find(
            Schedule.companion_id == str(user.id),
            Schedule.date == today
        ).to_list()

    return success([
        {
            "schedule_id": str(s.id),
            "title": s.title,
            "date": s.date,
            "start_time": s.start_time,
            "destination": s.destination,
            "status": s.status,
            "child_id": s.child_id,
        }
        for s in schedules
    ])


# GET /api/schedules/{schedule_id} - 일정 상세 조회
@router.get("/{schedule_id}")
async def get_schedule(schedule_id: str, user: User = Depends(get_current_user)):
    try:
        oid = PydanticObjectId(schedule_id)
    except Exception:
        return error("유효하지 않은 schedule_id입니다", 400)

    schedule = await Schedule.get(oid)
    if not schedule:
        return error("일정을 찾을 수 없습니다", 404)

    # 부모 또는 담당 동행인만 접근 가능
    if user.role == "parent" and schedule.guardian_id != str(user.id):
        return error("접근 권한이 없습니다", 403)
    if user.role == "companion" and schedule.companion_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

    # 아동 특성 가져오기
    child_traits = {}
    try:
        child_oid = PydanticObjectId(schedule.child_id)
        child = await Child.get(child_oid)
        if child:
            child_traits = {
                "caution_situations": child.caution_situations,
                "required_actions": child.required_actions,
                "calming_methods": child.calming_methods,
                "avoid_behaviors": child.avoid_behaviors,
                "difficult_environments": child.difficult_environments,
                "notice_time": child.notice_time,
            }
    except Exception:
        pass

    return success({
        "schedule_id": str(schedule.id),
        "title": schedule.title,
        "date": schedule.date,
        "start_time": schedule.start_time,
        "destination": schedule.destination,
        "transport": schedule.transport,
        "status": schedule.status,
        "child_id": schedule.child_id,
        "companion_id": schedule.companion_id,
        "preparations": schedule.preparations,
        "checklist": [
            {
                "item_id": c.item_id,
                "content": c.content,
                "is_checked": c.is_checked
            }
            for c in schedule.checklist
        ],
        "child_traits": child_traits,
        "journal": schedule.journal,
        "created_at": str(schedule.created_at),
        "updated_at": str(schedule.updated_at),
    })


# PATCH /api/schedules/{schedule_id} - 일정 수정 (부모 전용)
@router.patch("/{schedule_id}")
async def update_schedule(schedule_id: str, body: ScheduleUpdateRequest, user: User = Depends(parent_only)):
    try:
        oid = PydanticObjectId(schedule_id)
    except Exception:
        return error("유효하지 않은 schedule_id입니다", 400)

    schedule = await Schedule.get(oid)
    if not schedule:
        return error("일정을 찾을 수 없습니다", 404)
    if schedule.guardian_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

    # 업데이트 가능한 필드만 수정
    update_data = body.dict(exclude_unset=True)
    if "checklist" in update_data:
        # 체크리스트 텍스트 → ChecklistItem 변환
        update_data["checklist"] = [
            ChecklistItem(item_id=str(uuid.uuid4()), content=c)
            for c in update_data["checklist"]
        ]

    for field, value in update_data.items():
        setattr(schedule, field, value)
    schedule.updated_at = datetime.utcnow()
    await schedule.set(update_data)

    return success(None, "일정이 수정되었습니다")

# DELETE /api/schedules/{schedule_id} - 일정 삭제 (부모 전용)
@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: str, user: User = Depends(parent_only)):
    try:
        oid = PydanticObjectId(schedule_id)
    except Exception:
        return error("유효하지 않은 schedule_id입니다", 400)

    schedule = await Schedule.get(oid)
    if not schedule:
        return error("일정을 찾을 수 없습니다", 404)
    if schedule.guardian_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

    await schedule.delete()
    return success(None, "일정이 삭제되었습니다")


# PATCH /api/schedules/{schedule_id}/checklist - 체크리스트 완료 체크 (동행인/부모)
@router.patch("/{schedule_id}/checklist")
async def update_checklist(schedule_id: str, body: ChecklistUpdateRequest, user: User = Depends(get_current_user)):
    try:
        oid = PydanticObjectId(schedule_id)
    except Exception:
        return error("유효하지 않은 schedule_id입니다", 400)

    schedule = await Schedule.get(oid)
    if not schedule:
        return error("일정을 찾을 수 없습니다", 404)

    if user.role == "parent" and schedule.guardian_id != str(user.id):
        return error("접근 권한이 없습니다", 403)
    if user.role == "companion" and schedule.companion_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

    # 체크리스트 아이템 업데이트
    updated = False
    for item in schedule.checklist:
        if item.item_id == body.item_id:
            item.is_checked = body.is_checked
            updated = True
            break

    if not updated:
        return error("체크리스트 항목을 찾을 수 없습니다", 404)

    await schedule.set({
        "checklist": schedule.checklist,
        "updated_at": datetime.utcnow()
    })
    return success(None, "체크리스트가 업데이트되었습니다")


# POST /api/schedules/{schedule_id}/journal - 동행일지 등록 (동행인 전용)
@router.post("/{schedule_id}/journal")
async def create_journal(schedule_id: str, body: JournalCreateRequest, user: User = Depends(companion_only)):
    try:
        oid = PydanticObjectId(schedule_id)
    except Exception:
        return error("유효하지 않은 schedule_id입니다", 400)

    schedule = await Schedule.get(oid)
    if not schedule:
        return error("일정을 찾을 수 없습니다", 404)
    if schedule.companion_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

    await schedule.set({
        "journal": {
            "reaction": body.reaction,
            "difficulties": body.difficulties,
            "memo": body.memo,
            "recorded_at": str(datetime.utcnow())
        },
        "status": ScheduleStatus.done,
        "updated_at": datetime.utcnow()
    })

    return success(None, "동행일지가 등록되었습니다")