from beanie import Document
from pydantic import Field
from datetime import datetime
from enum import Enum


class GenderEnum(str, Enum):
    male = "남자아이"
    female = "여자아이"


class RelationEnum(str, Enum):
    primary = "주양육자"
    parent = "부모"
    grandparent = "조부모"


class DisabilityTypeEnum(str, Enum):
    intellectual = "지적장애"
    autism = "자폐스펙트럼장애"


# 3단계 - 설명 방식
EXPLANATION_STYLES = {
    "한번에 하나씩 말해줘야해요",
    "그림이나 사진이 있으면 좋아요",
    "짧고 쉬운 문장으로 말해줘야해요",
    "반복 설명이 필요해요",
    "선택지로 물어보면 잘 대답해요",
    "먼저 보여주고 설명하면 잘 이해해요",
}

# 3단계 - 의사소통 방식
COMMUNICATION_STYLES = {
    "문장으로 대답해요",
    "단어로 대답해요",
    "고개 끄덕이나 손짓으로 대답해요",
    "그림/사진 카드가 필요해요",
    "네/아니오로 대답해요",
    "불편함을 말로 표현하기 어려워요",
}

# 4단계 - 외출 중 주의가 필요한 상황
CAUTION_SITUATIONS = {
    "차도/차량 위험 인지를 어려워해요",
    "신호등/횡단보도 규칙을 어려워해요",
    "낯선 사람을 쉽게 따라갈 수 있어요",
    "동행인과 떨어지면 위험을 잘 인지하지 못해요",
    "갑자기 뛰어갈 수 있어요",
    "위험한 물건을 만질 수 있어요",
}

# 5단계 - 힘들어하는 환경
DIFFICULT_ENVIRONMENTS = {
    "큰 소리",
    "사람 많은 곳",
    "밝은 빛",
    "냄새",
    "신체 접촉",
    "갑작스러운 움직임",
    "대기",
    "밝은 빛",
}

# 5단계 - 힘들어하는 장소
DIFFICULT_PLACES = {
    "지하철",
    "새로운 장소",
    "병원",
    "식당",
    "버스",
    "마트",
    "놀이공원",
    "영화관/공연장",
}

# 6단계 - 이동/전환 시 어려워하는 상황
TRANSITION_DIFFICULTIES = {
    "이동 수단 타기",
    "기다리기",
    "하던 활동 멈추기",
    "장소 이동하기",
    "집에 돌아가기",
    "화장실 가기",
    "예정과 다른 일이 생기기",
}

# 6단계 - 미리 알려야 하는 시간
NOTICE_TIMES = {
    "바로 직전",
    "5분 전",
    "10분 전",
    "30분 전",
    "1시간 전",
    "3시간 전",
    "전 날",
}

# 7단계 - 도움이 되는 것
CALMING_METHODS = {
    "보호자 목소리",
    "좋아하는 물건",
    "간식",
    "조용한 공간",
    "손잡기",
    "설명해주기",
    "일정 다시 보여주기",
    "칭찬 격려",
}


class Child(Document):
    guardian_id: str

    # 1단계
    name: str
    gender: GenderEnum
    birth_date: str
    guardian_relation: RelationEnum

    # 2단계
    disability_type: DisabilityTypeEnum

    # 3단계
    explanation_styles: list[str] = []
    communication_styles: list[str] = []

    # 4단계
    caution_situations: list[str] = []
    required_actions: str = ""

    # 5단계
    difficult_environments: list[str] = []
    difficult_places: list[str] = []

    # 6단계
    transition_difficulties: list[str] = []
    notice_time: str = ""

    # 7단계
    calming_methods: list[str] = []
    avoid_behaviors: str = ""

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "children"