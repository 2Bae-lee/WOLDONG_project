from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
from typing import Optional


class ScheduleStatus(str, Enum):
    upcoming = "upcoming"
    ongoing = "ongoing"
    done = "done"


class ChecklistItem(BaseModel):
    item_id: str
    content: str
    is_checked: bool = False


class Schedule(Document):
    guardian_id: str
    child_id: str
    companion_id: Optional[str] = None
    title: str
    date: str                          # "YYYY-MM-DD"
    start_time: str                    # "HH:MM"
    destination: str
    transport: str
    preparations: list[str] = []       # 필수 준비물
    checklist: list[ChecklistItem] = [] # 체크리스트
    status: ScheduleStatus = ScheduleStatus.upcoming
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    journal: Optional[dict] = None  # 동행일지

    class Settings:
        name = "schedules"