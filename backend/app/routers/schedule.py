from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from beanie import PydanticObjectId
import uuid
import httpx

from app.models.user import User
from app.models.child import Child
from app.models.invite import CompanionRequest, RequestStatus
from app.models.schedule import Schedule, ScheduleStatus, ChecklistItem
from app.middleware.auth import parent_only, companion_only, get_current_user
from app.utils.response import success, error
from app.routers.ai import AI_SERVER_URL


router = APIRouter(prefix="/api/schedules", tags=["외출 일정"])


# ─── 요청 스키마 ────────────────────────────────────────
class ScheduleCreateRequest(BaseModel):
    child_id: str
    companion_id: Optional[str] = None
    title: str
    date: date
    start_time: str
    place_type: str                     # 장소 유형 (병원, 마트, 공원 등)
    transport_type: str                 # 이동수단 (버스, 지하철, 택시 등)
    activities: list[str] = []          # 활동 목록 (진료, 주사 등)
    wait_possible: bool = False         # 대기 가능성
    crowd_possible: bool = False        # 혼잡 가능성
    schedule_features: list[str] = []   # AI 모델 입력용 일정 특성 값
    preparations: list[str] = []
    checklist: list[str] = []

    class Config:
        json_schema_extra = {
            "example": {
                "child_id": "6a11374a0d58a12be7dfbd0a",
                "companion_id": "6a12a747ff493593beee803c",
                "title": "병원 정기검진",
                "date": "2026-06-01",
                "start_time": "10:00",
                "place_type": "병원",
                "transport_type": "버스",
                "activities": ["진료", "주사"],
                "wait_possible": True,
                "crowd_possible": True,
                "schedule_features": ["일정_장소_병원방문", "일정_활동_주사또는치료있음"],
                "preparations": ["선글라스", "이어폰"],
                "checklist": ["10분 전 일정 알려주기", "손 잡고 이동하기"]
            }
        }


class ScheduleUpdateRequest(BaseModel):
    title: Optional[str] = None
    date: Optional[date] = None
    start_time: Optional[str] = None
    place_type: Optional[str] = None
    transport_type: Optional[str] = None
    activities: Optional[list[str]] = None
    wait_possible: Optional[bool] = None
    crowd_possible: Optional[bool] = None
    schedule_features: Optional[list[str]] = None
    companion_id: Optional[str] = None
    preparations: Optional[list[str]] = None
    checklist: Optional[list[str]] = None
    status: Optional[ScheduleStatus] = None


class ChecklistUpdateRequest(BaseModel):
    item_id: str
    is_checked: bool


class JournalCreateRequest(BaseModel):
    reaction: str
    difficulties: str
    memo: Optional[str] = None


def build_schedule_warnings(schedule: Schedule, child: Child) -> list[str]:
    warnings: list[str] = []

    risk_score = 0
    if schedule.wait_possible:
        risk_score += 1
    if schedule.crowd_possible:
        risk_score += 1
    if schedule.place_type in child.difficult_places:
        risk_score += 1
    if schedule.transport_type in child.difficult_places:
        risk_score += 1
    if child.caution_situations:
        risk_score += 1

    if risk_score >= 3:
        warnings.append("오늘 일정의 전체 주의 수준은 높을 수 있습니다.")
    else:
        warnings.append("오늘 일정에 맞춰 아이가 편안하게 이동할 수 있도록 미리 안내해주세요.")

    difficult_environment_text = " ".join(child.difficult_environments)
    if schedule.crowd_possible or "사람 많은 곳" in child.difficult_environments:
        warnings.append("사람이 많은 환경에서는 이동 경로와 쉴 수 있는 장소를 미리 확인해주세요.")
    if "큰 소리" in child.difficult_environments:
        warnings.append("큰 소리가 날 수 있는 환경에서는 미리 알려주고 안정할 수 있도록 도와주세요.")
    if schedule.wait_possible or "대기" in child.difficult_environments or "기다리기" in child.transition_difficulties:
        warnings.append("아이가 기다리는 상황을 어려워할 수 있으니 대기 시간을 미리 알려주세요.")
    if schedule.place_type in child.difficult_places:
        warnings.append(f"{schedule.place_type} 장소를 어려워할 수 있으니 도착 전 짧게 설명해주세요.")
    if schedule.transport_type in child.difficult_places:
        warnings.append(f"{schedule.transport_type} 이동을 어려워할 수 있으니 탑승 전 과정을 차분히 알려주세요.")
    if any(keyword in " ".join(child.caution_situations) for keyword in ["차도", "차량", "횡단보도", "신호등"]):
        warnings.append("차도나 횡단보도 근처에서는 손을 잡고 규칙을 짧게 반복해서 알려주세요.")
    if any(keyword in " ".join(child.caution_situations) for keyword in ["뛰어", "떨어지"]):
        warnings.append("갑자기 뛰거나 떨어질 수 있으니 이동 중 가까운 거리에서 함께해주세요.")
    if child.required_actions:
        warnings.append(f"필수 행동: {child.required_actions}")
    if child.calming_methods:
        warnings.append(f"진정이 필요할 때는 {child.calming_methods[0]}을 먼저 시도해주세요.")
    if child.avoid_behaviors:
        warnings.append(f"피해야 할 행동: {child.avoid_behaviors}")
    if child.notice_time:
        warnings.append(f"일정 변화나 이동은 {child.notice_time}에 미리 알려주세요.")
    if not difficult_environment_text and not child.difficult_places and not child.caution_situations:
        warnings.append("일정 전후로 아이의 표정과 몸짓 변화를 천천히 관찰해주세요.")

    deduped: list[str] = []
    for warning in warnings:
        if warning and warning not in deduped:
            deduped.append(warning)

    return deduped[:5]


# ─── 라우트 ────────────────────────────────────────────

# POST /api/schedules - 일정 등록 (부모/동행인 공통)
@router.post("")
async def create_schedule(body: ScheduleCreateRequest, user: User = Depends(get_current_user)):
    try:
        oid = PydanticObjectId(body.child_id)
    except Exception:
        return error("유효하지 않은 child_id입니다", 400)

    child = await Child.get(oid)
    if not child:
        return error("아동 프로필을 찾을 수 없습니다", 404)

    companion_id = body.companion_id
    if user.role == "parent":
        if child.guardian_id != str(user.id):
            return error("접근 권한이 없습니다", 403)
    elif user.role == "companion":
        approved_request = await CompanionRequest.find_one(
            CompanionRequest.companion_id == str(user.id),
            CompanionRequest.child_id == body.child_id,
            CompanionRequest.status == RequestStatus.approved
        )
        if not approved_request:
            return error("접근 권한이 없습니다", 403)
        companion_id = str(user.id)
    else:
        return error("접근 권한이 없습니다", 403)

    checklist_items = [
        ChecklistItem(item_id=str(uuid.uuid4()), content=c)
        for c in body.checklist
    ]

    schedule = Schedule(
        guardian_id=child.guardian_id,
        child_id=body.child_id,
        companion_id=companion_id,
        title=body.title,
        date=body.date.isoformat(),
        start_time=body.start_time,
        place_type=body.place_type,
        transport_type=body.transport_type,
        activities=body.activities,
        wait_possible=body.wait_possible,
        crowd_possible=body.crowd_possible,
        schedule_features=body.schedule_features,
        preparations=body.preparations,
        checklist=checklist_items,
    )
    await schedule.insert()

    return success({
        "schedule_id": str(schedule.id),
        "title": schedule.title,
        "created_at": str(schedule.created_at)
    }, "일정이 등록되었습니다", 201)


# GET /api/schedules - 일정 목록 조회
@router.get("")
async def get_schedules(user: User = Depends(get_current_user)):
    if user.role == "parent":
        schedules = await Schedule.find(
            Schedule.guardian_id == str(user.id)
        ).sort(-Schedule.date).to_list()
    else:
        schedules = await Schedule.find(
            Schedule.companion_id == str(user.id)
        ).sort(-Schedule.date).to_list()

    return success([
        {
            "schedule_id": str(s.id),
            "title": s.title,
            "date": s.date,
            "start_time": s.start_time,
            "destination": s.place_type,
            "place_type": s.place_type,
            "transport_type": s.transport_type,
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
            "destination": s.place_type,
            "place_type": s.place_type,
            "transport_type": s.transport_type,
            "status": s.status,
            "child_id": s.child_id,
        }
        for s in schedules
    ])


# GET /api/schedules/{schedule_id}/warnings - 일정/장소 맞춤형 아동 특이사항 핵심 카드 조회
@router.get("/{schedule_id}/warnings")
async def get_schedule_warnings(schedule_id: str, user: User = Depends(companion_only)):
    try:
        oid = PydanticObjectId(schedule_id)
    except Exception:
        return error("유효하지 않은 schedule_id입니다", 400)

    schedule = await Schedule.get(oid)
    if not schedule:
        return error("일정을 찾을 수 없습니다", 404)
    if schedule.companion_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

    try:
        child_oid = PydanticObjectId(schedule.child_id)
    except Exception:
        return error("아동 프로필을 찾을 수 없습니다", 404)

    child = await Child.get(child_oid)
    if not child:
        return error("아동 프로필을 찾을 수 없습니다", 404)

    return success({
        "warnings": build_schedule_warnings(schedule, child)
    })


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

    if user.role == "parent" and schedule.guardian_id != str(user.id):
        return error("접근 권한이 없습니다", 403)
    if user.role == "companion" and schedule.companion_id != str(user.id):
        return error("접근 권한이 없습니다", 403)

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
        "place_type": schedule.place_type,
        "transport_type": schedule.transport_type,
        "activities": schedule.activities,
        "wait_possible": schedule.wait_possible,
        "crowd_possible": schedule.crowd_possible,
        "schedule_features": schedule.schedule_features,
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

    update_data = body.model_dump(exclude_none=True)
    if "date" in update_data:
        update_data["date"] = update_data["date"].isoformat()
    if "checklist" in update_data:
        update_data["checklist"] = [
            ChecklistItem(item_id=str(uuid.uuid4()), content=c)
            for c in update_data["checklist"]
        ]
    update_data["updated_at"] = datetime.utcnow()

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


# PATCH /api/schedules/{schedule_id}/checklist - 체크리스트 완료 체크
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

# GET /api/schedules/{schedule_id}/warnings - 주의사항 예측
@router.get("/{schedule_id}/warnings")
async def get_warnings(schedule_id: str, user: User = Depends(get_current_user)):
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

    # 아동 특성 가져오기
    child = None
    try:
        child_oid = PydanticObjectId(schedule.child_id)
        child = await Child.get(child_oid)
    except Exception:
        pass

    # checked_items 만들기
    checked_items = []

    # 일정 정보 변환
    place_map = {
        "병원": "일정_장소_병원방문",
        "학교": "일정_장소_학교방문",
        "마트": "일정_장소_마트방문",
        "공공기관": "일정_장소_공공기관방문",
        "새로운 장소": "일정_장소_새로운장소",
        "야외": "일정_장소_야외활동",
    }
    transport_map = {
        "버스": "일정_이동_버스이용",
        "지하철": "일정_이동_지하철이용",
        "택시": "일정_이동_차량이동",
        "도보": "일정_이동_도보이동",
    }
    activity_map = {
        "진료": "일정_활동_진료있음",
        "검사": "일정_활동_검사있음",
        "주사": "일정_활동_주사또는치료있음",
        "식사": "일정_활동_식사있음",
        "구매": "일정_활동_구매또는계산있음",
        "상담": "일정_활동_상담또는설명듣기",
    }

    if schedule.place_type in place_map:
        checked_items.append(place_map[schedule.place_type])
    if schedule.transport_type in transport_map:
        checked_items.append(transport_map[schedule.transport_type])
    for activity in schedule.activities:
        if activity in activity_map:
            checked_items.append(activity_map[activity])
    if schedule.wait_possible:
        checked_items.append("일정_환경_대기시간있음")
    if schedule.crowd_possible:
        checked_items.append("일정_환경_사람많음")

    # 아동 특성 변환
    if child:
        env_map = {
            "큰 소리": "아동_환경_큰 소리",
            "사람 많은 곳": "아동_환경_사람 많은 곳",
            "밝은 빛": "아동_환경_밝은 빛",
            "냄새": "아동_환경_냄새",
            "신체 접촉": "아동_환경_신체 접촉",
            "갑작스러운 움직임": "아동_환경_갑작스러운 움직임",
            "대기": "아동_환경_대기",
        }
        caution_map = {
            "차도/차량 위험 인지를 어려워해요": "아동_외출주의_차도/차량 위험 인지를 어려워해요",
            "신호등/횡단보도 규칙을 어려워해요": "아동_외출주의_신호등/횡단보도 규칙을 어려워해요",
            "낯선 사람을 쉽게 따라갈 수 있어요": "아동_외출주의_낯선 사람을 쉽게 따라갈 수 있어요",
            "동행인과 떨어지면 위험을 잘 인지하지 못해요": "아동_외출주의_동행인과 떨어지면 위험을 잘 인지하지 못해요",
            "갑자기 뛰어갈 수 있어요": "아동_외출주의_갑자기 뛰어갈 수 있어요",
            "위험한 물건을 만질 수 있어요": "아동_외출주의_위험한 물건을 만질 수 있어요",
        }
        place_difficult_map = {
            "지하철": "아동_장소_지하철",
            "새로운 장소": "아동_장소_새로운 장소",
            "병원": "아동_장소_병원",
            "식당": "아동_장소_식당",
            "버스": "아동_장소_버스",
            "마트": "아동_장소_마트",
            "놀이공원": "아동_장소_놀이공원",
            "영화관/공연장": "아동_장소_영화관/공연장",
        }

        for env in child.difficult_environments:
            if env in env_map:
                checked_items.append(env_map[env])
        for caution in child.caution_situations:
            if caution in caution_map:
                checked_items.append(caution_map[caution])
        for place in child.difficult_places:
            if place in place_difficult_map:
                checked_items.append(place_difficult_map[place])

    # AI 서버로 전송
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVER_URL}/predict-warning",
                json={
                    "checked_items": checked_items,
                    "threshold": 0.5
                },
                timeout=30.0
            )
        return success(response.json(), "주의사항 예측 완료")
    except httpx.ConnectError:
        return error("AI 서버에 연결할 수 없습니다", 503)
    except Exception as e:
        return error(f"AI 서버 오류: {str(e)}", 500)
