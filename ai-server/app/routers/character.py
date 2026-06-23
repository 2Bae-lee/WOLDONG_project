from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.models.character import CharacterFramesResponse, CharacterRequest
from app.services.character_service import create_character_frames, create_character_image

router = APIRouter(tags=["캐릭터"])


@router.post("/generate-character", summary="캐릭터 이미지 생성")
def generate_character(req: CharacterRequest):
    filename = create_character_image(req.traits)

    return FileResponse(
        filename,
        media_type="image/png"
    )


@router.post(
    "/generate-character-frames",
    response_model=CharacterFramesResponse,
    summary="말하는 캐릭터 프레임 생성",
)
def generate_character_frames(req: CharacterRequest):
    return CharacterFramesResponse(
        character_images=create_character_frames(req.traits)
    )
