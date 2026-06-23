import csv
from itertools import combinations
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_PATH = BASE_DIR / "social_story_dataset.csv"


CATEGORY_ITEMS = {
    "hospital_waiting": [
        "아동_장소_병원",
        "일정_장소_병원방문",
        "일정_환경_대기시간있음",
        "아동_일정변화_기다리기",
        "아동_미리알림_10분 전",
        "아동_설명_반복 설명이 필요해요",
    ],
    "medical_procedure": [
        "일정_활동_진료있음",
        "일정_활동_검사있음",
        "일정_활동_주사또는치료있음",
        "아동_환경_신체 접촉",
        "아동_장소_병원",
        "아동_설명_한번에 하나씩 말해주세요",
    ],
    "sensory_support": [
        "아동_환경_큰 소리",
        "아동_환경_밝은 빛",
        "아동_환경_냄새",
        "아동_환경_신체 접촉",
        "일정_환경_큰소리있음",
        "일정_환경_밝은빛있음",
        "일정_환경_냄새강함",
        "일정_환경_사람많음",
    ],
    "transport_safety": [
        "일정_이동_버스이용",
        "일정_이동_지하철이용",
        "일정_이동_도보이동",
        "일정_이동_차량이동",
        "일정_이동_환승있음",
        "아동_장소_버스",
        "아동_장소_지하철",
        "아동_외출주의_갑자기 뛰어갈 수 있어요",
    ],
    "schedule_change": [
        "일정_변수_일정변경가능성",
        "일정_변수_시간압박있음",
        "아동_일정변화_예정과 다른 일이 생기기",
        "아동_일정변화_하던 활동 멈추기",
        "아동_일정변화_장소 이동하기",
        "아동_미리알림_30분 전",
    ],
    "new_place": [
        "아동_장소_새로운 장소",
        "일정_장소_새로운장소",
        "아동_설명_먼저 보여주고 설명하면 잘 이해해요",
        "아동_설명_그림이나 사진이 있으면 좋아요",
        "아동_미리알림_전 날",
        "일정_변수_낯선사람만남",
    ],
    "safety_rule": [
        "아동_외출주의_차도/차량 위험 인지를 어려워해요",
        "아동_외출주의_신호등/횡단보도 규칙을 어려워해요",
        "아동_외출주의_낯선 사람을 쉽게 따라갈 수 있어요",
        "아동_외출주의_동행인과 떨어지면 위험을 잘 인지하지 못해요",
        "일정_변수_규칙을지켜야함",
        "일정_변수_보호자와분리상황있음",
    ],
    "shopping_public": [
        "일정_장소_마트방문",
        "아동_장소_마트",
        "일정_활동_구매또는계산있음",
        "일정_환경_사람많음",
        "아동_환경_대기",
        "아동_일정변화_기다리기",
    ],
    "public_place": [
        "일정_장소_공공기관방문",
        "일정_장소_야외활동",
        "아동_장소_놀이공원",
        "아동_장소_영화관/공연장",
        "일정_환경_사람많음",
        "아동_외출주의_낯선 사람을 쉽게 따라갈 수 있어요",
    ],
    "restaurant": [
        "아동_장소_식당",
        "일정_활동_식사있음",
        "아동_환경_냄새",
        "아동_환경_사람 많은 곳",
        "아동_의사소통_불편함을 말로 표현하기 어려워요",
        "아동_일정변화_기다리기",
    ],
    "separation_support": [
        "일정_변수_보호자와분리상황있음",
        "아동_외출주의_동행인과 떨어지면 위험을 잘 인지하지 못해요",
        "아동_의사소통_그림/사진 카드가 필요해요",
        "아동_의사소통_고개 끄덕임이나 손짓으로 대답해요",
        "아동_미리알림_5분 전",
        "아동_미리알림_10분 전",
    ],
    "rule_following": [
        "일정_변수_규칙을지켜야함",
        "아동_설명_짧고 쉬운 문장으로 말해주세요",
        "아동_설명_한번에 하나씩 말해주세요",
        "아동_설명_반복 설명이 필요해요",
        "아동_의사소통_네/아니오로 대답해요",
        "일정_활동_상담또는설명듣기",
    ],
    "transition_preparation": [
        "아동_일정변화_이동 수단 타기",
        "아동_일정변화_하던 활동 멈추기",
        "아동_일정변화_집에 돌아가기",
        "아동_일정변화_화장실 가기",
        "아동_미리알림_1시간 전",
        "일정_변수_완료후보상있음",
    ],
    "communication_support": [
        "아동_의사소통_문장으로 대답해요",
        "아동_의사소통_단어로 대답해요",
        "아동_의사소통_고개 끄덕임이나 손짓으로 대답해요",
        "아동_의사소통_그림/사진 카드가 필요해요",
        "아동_의사소통_불편함을 말로 표현하기 어려워요",
        "아동_설명_선택지로 물어보면 잘 대답해요",
    ],
}


def generate_rows():
    rows = []

    for category, items in CATEGORY_ITEMS.items():
        for tone in ["kind", "strict"]:
            for size in [3, 4]:
                for combo in combinations(items, size):
                    rows.append({
                        "checked_items": "|".join(combo),
                        "tone": tone,
                        "category": category,
                    })

    return rows


def main():
    rows = generate_rows()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["checked_items", "tone", "category"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"saved dataset: {OUTPUT_PATH}")
    print(f"dataset size: {len(rows)}")
    print(f"categories: {len(CATEGORY_ITEMS)}")


if __name__ == "__main__":
    main()
