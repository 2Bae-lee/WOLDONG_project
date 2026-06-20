from fastapi import FastAPI

from app.routers.character import router as character_router

app = FastAPI()

app.include_router(character_router)


@app.get("/")
def root():
    return {"message": "AI Server Running"}
