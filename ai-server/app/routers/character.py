from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.models.character import CharacterFramesResponse, CharacterRequest
from app.services.character_service import create_character_frames, create_character_image

router = APIRouter()


@router.post("/generate-character")
def generate_character(req: CharacterRequest):
    filename = create_character_image(req.traits)

    return FileResponse(
        filename,
        media_type="image/png"
    )


@router.post("/generate-character-frames", response_model=CharacterFramesResponse)
def generate_character_frames(req: CharacterRequest):
    return CharacterFramesResponse(
        character_images=create_character_frames(req.traits)
    )
