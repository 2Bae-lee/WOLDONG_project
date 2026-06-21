from pydantic import BaseModel


class CharacterRequest(BaseModel):
    traits: str
