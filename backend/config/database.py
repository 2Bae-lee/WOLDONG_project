from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import settings
from app.models.user import User
from app.models.verification import Verification
from app.models.child import Child
from app.models.invite import InviteCode, CompanionRequest
from app.models.notification import Notification

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(
        database=client.weoldong,
        document_models=[User, Verification, Child, InviteCode, CompanionRequest, Notification]
    )
    print("✅ MongoDB 연결 성공")




