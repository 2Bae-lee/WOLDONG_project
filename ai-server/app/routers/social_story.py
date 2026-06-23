from pathlib import Path

from fastapi import APIRouter, HTTPException

from ai_model.inference import predict_warnings
from ai_model.social_story_difficulty_inference import predict_social_story_difficulty
from ai_model.social_story_inference import predict_social_story_category
from app.models.social_story import SocialStoryRequest, SocialStoryResponse
from app.services.story_style import convert_tone
from app.services.tts_service import synthesize_speech

router = APIRouter()


@router.post("/social-story/tts", response_model=SocialStoryResponse)
def generate_social_story_tts(req: SocialStoryRequest):
    if not req.script.strip():
        raise HTTPException(status_code=400, detail="script must not be empty")

    if req.voice not in {"female", "male"}:
        raise HTTPException(status_code=400, detail="voice must be female or male")

    if req.speed not in {"slow", "normal", "fast"}:
        raise HTTPException(status_code=400, detail="speed must be slow, normal, or fast")

    try:
        predicted_warnings = (
            predict_warnings(req.checked_items, threshold=req.threshold)
            if req.checked_items
            else []
        )
        story_category = (
            predict_social_story_category(req.checked_items, tone=req.tone)
            if req.checked_items
            else "general"
        )
        story_difficulty = (
            predict_social_story_difficulty(req.checked_items, tone=req.tone)
            if req.checked_items
            else "low"
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    converted_script = convert_tone(
        req.script,
        req.tone,
        checked_items=req.checked_items,
        predicted_warnings=predicted_warnings,
        story_category=story_category,
        story_difficulty=story_difficulty,
    )

    try:
        audio_path = synthesize_speech(
            converted_script,
            voice=req.voice,
            tone=req.tone,
            speed=req.speed,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    audio_filename = Path(audio_path).name

    return SocialStoryResponse(
        original_script=req.script,
        converted_script=converted_script,
        audio_url=f"/static/audio/{audio_filename}",
        story_category=story_category,
        story_difficulty=story_difficulty,
        predicted_warnings=predicted_warnings,
    )
