from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config.database import init_db
from app.routers import auth
from app.routers.child import router as child_router
from app.routers.invite import router as invite_router
from app.routers.notification import router as notification_router
from app.routers.home import router as home_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="월동 API",
    description="발달장애 아동 외출 지원 앱 백엔드",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)

# (추후 추가)
# app.include_router(children.router)
# app.include_router(schedules.router)
# app.include_router(handover.router)

@app.get("/")
async def root():
    return {"success": True, "message": "월동 서버가 정상 실행 중입니다 🌙"}

@app.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(child_router) 
app.include_router(invite_router)
app.include_router(notification_router)
app.include_router(home_router)