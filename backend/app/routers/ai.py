from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
import httpx

from app.models.user import User
from app.middleware.auth import get_current_user
from app.utils.response import success, error
from config.settings import settings

router = APIRouter(prefix="/api/ai", tags=["AI 연동"])

AI_SERVER_URL = settings.AI_SERVER_URL.rstrip("/")
AI_SERVER_HEADERS = {"ngrok-skip-browser-warning": "true"}


# ─── 요청 스키마 ────────────────────────────────────────
class PredictWarningRequest(BaseModel):
    checked_items: list[str]
    threshold: float = 0.5

    class Config:
        json_schema_extra = {
            "example": {
                "checked_items": ["아동_장소_병원", "일정_환경_대기시간있음"],
                "threshold": 0.5
            }
        }


class GenerateCharacterRequest(BaseModel):
    traits: str

    class Config:
        json_schema_extra = {
            "example": {
                "traits": "노란색 토끼 캐릭터, 파란 모자, 귀여운 느낌"
            }
        }


class SocialStoryTTSRequest(BaseModel):
    script: str
    tone: str = "kind"
    speed: str = "normal"
    voice: str = "female"
    checked_items: list[str] = []
    threshold: float = 0.5

    class Config:
        json_schema_extra = {
            "example": {
                "script": "오늘은 병원에 가요.",
                "tone": "kind",
                "speed": "slow",
                "voice": "female",
                "checked_items": ["아동_장소_병원", "일정_환경_대기시간있음"],
                "threshold": 0.5
            }
        }


# ─── 라우트 ────────────────────────────────────────────

# POST /api/ai/predict-warning - 주의사항 예측
@router.post("/predict-warning")
async def predict_warning(body: PredictWarningRequest, user: User = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVER_URL}/predict-warning",
                json={
                    "checked_items": body.checked_items,
                    "threshold": body.threshold
                },
                timeout=30.0
            )
        return success(response.json(), "주의사항 예측 완료")
    except httpx.ConnectError:
        return error("AI 서버에 연결할 수 없습니다", 503)
    except Exception as e:
        return error(f"AI 서버 오류: {str(e)}", 500)


# POST /api/ai/generate-character-frames - 캐릭터 프레임 생성
@router.post("/generate-character-frames")
async def generate_character_frames(body: GenerateCharacterRequest, user: User = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVER_URL}/generate-character-frames",
                json={"traits": body.traits},
                timeout=60.0
            )
        return success(response.json(), "캐릭터 프레임 생성 완료")
    except httpx.ConnectError:
        return error("AI 서버에 연결할 수 없습니다", 503)
    except Exception as e:
        return error(f"AI 서버 오류: {str(e)}", 500)


# POST /api/ai/social-story/tts - 소셜 스토리 생성 + TTS
@router.post("/social-story/tts")
async def social_story_tts(body: SocialStoryTTSRequest, user: User = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVER_URL}/social-story/tts",
                headers=AI_SERVER_HEADERS,
                json={
                    "script": body.script,
                    "tone": body.tone,
                    "speed": body.speed,
                    "voice": body.voice,
                    "checked_items": body.checked_items,
                    "threshold": body.threshold
                },
                timeout=240.0
            )
        response.raise_for_status()
        return success(response.json(), "소셜 스토리 생성 완료")
    except httpx.ConnectError:
        return error("AI 서버에 연결할 수 없습니다", 503)
    except Exception as e:
        return error(f"AI 서버 오류: {str(e)}", 500)


# GET /api/ai/social-story/{schedule_id} - 일정 기반 소셜 스토리 자동 생성
@router.get("/social-story/{schedule_id}")
async def get_social_story(
    schedule_id: str,
    script: str,
    tone: Optional[str] = None,
    speed: Optional[str] = None,
    voice: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    from beanie import PydanticObjectId
    from app.models.schedule import Schedule
    from app.models.child import Child

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

    # 아동 특성 + 캐릭터 설정 가져오기
    try:
        child_oid = PydanticObjectId(schedule.child_id)
        child = await Child.get(child_oid)
    except Exception:
        return error("유효하지 않은 child_id입니다", 400)
    if not child:
        return error("아동 프로필을 찾을 수 없습니다", 404)

    final_tone = tone or child.character_tone or "kind"
    final_speed = speed or child.character_speed or "normal"
    final_voice = voice or child.character_voice or "female"

    # checked_items 만들기
    checked_items = []

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

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVER_URL}/social-story/tts",
                headers=AI_SERVER_HEADERS,
                json={
                    "script": script,
                    "tone": final_tone,
                    "speed": final_speed,
                    "voice": final_voice,
                    "checked_items": checked_items,
                    "threshold": 0.5
                },
                timeout=240.0
            )
        response.raise_for_status()
        return success(response.json(), "소셜 스토리 생성 완료")
    except httpx.ConnectError:
        return error("AI 서버에 연결할 수 없습니다", 503)
    except Exception as e:
        return error(f"AI 서버 오류: {str(e)}", 500)
