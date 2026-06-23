import csv
from itertools import combinations
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_PATH = BASE_DIR / "social_story_difficulty_dataset.csv"

LOW_ITEMS = [
    "아동_미리알림_10분 전",
    "아동_설명_짧고 쉬운 문장으로 말해주세요",
    "아동_의사소통_문장으로 대답해요",
    "일정_변수_완료후보상있음",
    "아동_미리알림_30분 전",
]
MEDIUM_ITEMS = [
    "아동_장소_병원",
    "일정_장소_병원방문",
    "일정_환경_대기시간있음",
    "아동_일정변화_기다리기",
    "아동_환경_사람 많은 곳",
    "일정_이동_버스이용",
    "일정_활동_진료있음",
]
HIGH_ITEMS = [
    "아동_환경_큰 소리",
    "아동_환경_밝은 빛",
    "아동_의사소통_불편함을 말로 표현하기 어려워요",
    "아동_외출주의_갑자기 뛰어갈 수 있어요",
    "일정_변수_보호자와분리상황있음",
    "일정_변수_일정변경가능성",
    "일정_활동_주사또는치료있음",
    "일정_환경_사람많음",
]


def _rows_for(items, tone, difficulty, sizes):
    rows = []
    for size in sizes:
        for combo in combinations(items, size):
            rows.append({
                "checked_items": "|".join(combo),
                "tone": tone,
                "difficulty": difficulty,
            })
    return rows


def generate_rows():
    rows = []

    for tone in ["kind", "strict"]:
        rows.extend(_rows_for(LOW_ITEMS, tone, "low", [2, 3]))
        rows.extend(_rows_for(MEDIUM_ITEMS, tone, "medium", [3, 4]))
        rows.extend(_rows_for(HIGH_ITEMS, tone, "high", [3, 4]))

        for low_item in LOW_ITEMS:
            for medium_pair in combinations(MEDIUM_ITEMS, 2):
                rows.append({
                    "checked_items": "|".join([low_item, *medium_pair]),
                    "tone": tone,
                    "difficulty": "medium",
                })

        for medium_item in MEDIUM_ITEMS:
            for high_pair in combinations(HIGH_ITEMS, 2):
                rows.append({
                    "checked_items": "|".join([medium_item, *high_pair]),
                    "tone": tone,
                    "difficulty": "high",
                })

    return rows


def main():
    rows = generate_rows()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["checked_items", "tone", "difficulty"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"saved dataset: {OUTPUT_PATH}")
    print(f"dataset size: {len(rows)}")
    print("labels: low, medium, high")


if __name__ == "__main__":
    main()
