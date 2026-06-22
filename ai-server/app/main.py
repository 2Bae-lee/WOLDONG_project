from fastapi import FastAPI

from app.routers.character import router as character_router
from app.routers.social_story import router as social_story_router
from app.routers.warning import router as warning_router

app = FastAPI()

app.include_router(character_router)
app.include_router(social_story_router)
app.include_router(warning_router)


@app.get("/")
def root():
    return {"message": "AI Server Running"}
