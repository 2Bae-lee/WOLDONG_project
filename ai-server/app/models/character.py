from pydantic import BaseModel


class CharacterRequest(BaseModel):
    traits: str


class CharacterFramesResponse(BaseModel):
    character_images: dict[str, str]
