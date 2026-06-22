from fastapi import APIRouter, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
import httpx

from app.models.user import User
from app.middleware.auth import get_current_user
from app.utils.response import success, error

router = APIRouter(prefix="/api/ai", tags=["AI 연동"])

AI_SERVER_URL = "https://sheath-crushed-sixteen.ngrok-free.dev"


# ─── 요청 스키마 ────────────────────────────────────────
class PredictWarningRequest(BaseModel):
    checked_items: list[str]
    threshold: float = 0.5

    class Config:
        json_schema_extra = {
            "example": {
                "checked_items": ["큰 소리에 민감", "사람 많은 곳 어려움"],
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

    class Config:
        json_schema_extra = {
            "example": {
                "script": "병원에 가기 전에 손을 잡고 기다려요.",
                "tone": "kind",
                "speed": "normal",
                "voice": "female"
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


# POST /api/ai/generate-character - 캐릭터 이미지 생성
@router.post("/generate-character")
async def generate_character(body: GenerateCharacterRequest, user: User = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVER_URL}/generate-character",
                json={"traits": body.traits},
                timeout=60.0  # 이미지 생성은 시간이 걸릴 수 있어서 60초
            )
        # 이미지 파일로 반환
        return Response(
            content=response.content,
            media_type="image/png"
        )
    except httpx.ConnectError:
        return error("AI 서버에 연결할 수 없습니다", 503)
    except Exception as e:
        return error(f"AI 서버 오류: {str(e)}", 500)


# POST /api/ai/social-story/tts - 소셜 스토리 TTS
@router.post("/social-story/tts")
async def social_story_tts(body: SocialStoryTTSRequest, user: User = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVER_URL}/social-story/tts",
                json={
                    "script": body.script,
                    "tone": body.tone,
                    "speed": body.speed,
                    "voice": body.voice
                },
                timeout=60.0
            )
        return success(response.json(), "TTS 생성 완료")
    except httpx.ConnectError:
        return error("AI 서버에 연결할 수 없습니다", 503)
    except Exception as e:
        return error(f"AI 서버 오류: {str(e)}", 500)