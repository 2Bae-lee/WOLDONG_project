from pydantic import BaseModel, Field


class SocialStoryRequest(BaseModel):
    script: str
    tone: str = "kind"
    speed: str = "normal"
    voice: str = "female"
    checked_items: list[str] = Field(default_factory=list)
    threshold: float = Field(default=0.5, ge=0.0, le=1.0)


class SocialStoryResponse(BaseModel):
    original_script: str
    converted_script: str
    audio_url: str
    story_category: str = "general"
    story_difficulty: str = "low"
    predicted_warnings: list[str] = Field(default_factory=list)
