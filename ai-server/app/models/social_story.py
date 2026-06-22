from pydantic import BaseModel


class SocialStoryRequest(BaseModel):
    script: str
    tone: str = "kind"
    speed: str = "normal"
    voice: str = "female"


class SocialStoryResponse(BaseModel):
    original_script: str
    converted_script: str
    audio_url: str
