from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


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
    title: str                          # 예) 병원 정기검진
    date: str                           # "YYYY-MM-DD"
    start_time: str                     # "HH:MM"
    place_type: str                     # 장소 유형 (병원, 마트, 공원 등)
    transport_type: str                 # 이동수단 (버스, 지하철, 택시 등)
    activities: list[str] = []          # 활동 목록 (진료, 주사 등)
    wait_possible: bool = False         # 대기 가능성
    crowd_possible: bool = False        # 혼잡 가능성
    schedule_features: list[str] = []   # AI 모델 입력용 일정 특성 값
    preparations: list[str] = []        # 필수 준비물
    checklist: list[ChecklistItem] = [] # 체크리스트
    status: ScheduleStatus = ScheduleStatus.upcoming
    journal: Optional[dict] = None      # 동행일지
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "schedules"
