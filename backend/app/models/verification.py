from beanie import Document
from datetime import datetime
from typing import Optional

class Verification(Document):
    email: str
    code: str
    is_verified: bool = False
    created_at: datetime = datetime.now()

    class Settings:
        name = "verifications"