def _has_any(items: list[str], keywords: list[str]) -> bool:
    return any(any(keyword in item for keyword in keywords) for item in items)


def _category_sentence(category: str, tone: str) -> str:
    kind_sentences = {
        "hospital_waiting": "병원에서는 차례대로 기다리고 선생님을 만날 수 있어요.",
        "medical_procedure": "검사나 치료가 있을 때는 먼저 설명을 듣고 하나씩 해볼 수 있어요.",
        "sensory_support": "불편한 소리나 빛, 냄새가 있으면 보호자에게 알려도 괜찮아요.",
        "transport_safety": "이동할 때는 보호자 가까이에서 천천히 함께 움직여요.",
        "schedule_change": "예정과 다른 일이 생겨도 보호자가 옆에서 다음 일을 알려줄 거예요.",
        "new_place": "새로운 장소에서는 먼저 둘러보고 천천히 익숙해질 수 있어요.",
        "safety_rule": "위험한 곳에서는 보호자 손을 잡고 안전 규칙을 지켜요.",
        "shopping_public": "마트나 계산하는 곳에서는 차례를 기다리고 필요한 것을 하나씩 해요.",
        "public_place": "사람이 많은 곳에서는 보호자와 가까이 있으면 더 안전해요.",
        "restaurant": "식당에서는 자리에 앉아 기다리고, 불편하면 보호자에게 말해요.",
        "separation_support": "보호자와 잠깐 떨어져야 할 때는 언제 다시 만나는지 먼저 확인해요.",
        "rule_following": "규칙이 있는 곳에서는 한 번에 하나씩 차분히 따라 해요.",
        "transition_preparation": "활동이 바뀔 때는 미리 듣고 다음 행동을 준비해요.",
        "communication_support": "말하기 어려울 때는 고개를 끄덕이거나 카드로 알려도 괜찮아요.",
        "general": "오늘 할 일을 천천히 알아보고 하나씩 해볼 수 있어요.",
    }
    strict_sentences = {
        "hospital_waiting": "병원에서는 순서를 기다리고 안내에 따라 움직입니다.",
        "medical_procedure": "검사나 치료 전에는 설명을 듣고 정해진 순서를 따릅니다.",
        "sensory_support": "불편한 자극이 있으면 뛰지 말고 보호자에게 알립니다.",
        "transport_safety": "이동할 때는 보호자 가까이에 있고 안전 규칙을 지킵니다.",
        "schedule_change": "일정이 바뀌면 보호자의 설명을 듣고 다음 행동을 따릅니다.",
        "new_place": "새로운 장소에서는 보호자와 함께 이동하고 안내를 확인합니다.",
        "safety_rule": "위험한 곳에서는 멈추고 보호자의 지시를 따릅니다.",
        "shopping_public": "공공장소에서는 차례를 기다리고 정해진 행동을 합니다.",
        "public_place": "사람이 많은 곳에서는 보호자와 떨어지지 않습니다.",
        "restaurant": "식당에서는 자리에 앉아 차분히 기다립니다.",
        "separation_support": "보호자와 떨어지는 상황에서는 약속된 장소와 시간을 확인합니다.",
        "rule_following": "규칙이 있는 상황에서는 한 번에 하나씩 지시를 따릅니다.",
        "transition_preparation": "활동이 바뀌면 하던 일을 멈추고 다음 행동을 준비합니다.",
        "communication_support": "도움이 필요하면 말이나 손짓, 카드로 표현합니다.",
        "general": "오늘 해야 할 일을 확인하고 차분히 따라갑니다.",
    }
    source = strict_sentences if tone == "strict" else kind_sentences
    return source.get(category, source["general"])


def _limit_by_difficulty(sentences: list[str], difficulty: str, tone: str) -> list[str]:
    if difficulty == "low":
        limit = 3 if tone == "kind" else 2
    elif difficulty == "medium":
        limit = 5 if tone == "kind" else 4
    else:
        limit = 7 if tone == "kind" else 6

    return sentences[:limit]


def _kind_story(
    script: str,
    checked_items: list[str],
    predicted_warnings: list[str],
    story_category: str,
    story_difficulty: str,
) -> str:
    sentences = [script.strip()]
    sentences.append(_category_sentence(story_category, "kind"))

    if _has_any(checked_items, ["병원", "진료", "검사", "주사", "치료"]):
        sentences.append("병원에서는 차례대로 기다리고 선생님을 만날 수 있어요.")

    if _has_any(checked_items, ["대기", "기다리기"]):
        sentences.append("기다리는 시간이 생기면 보호자와 함께 천천히 기다려요.")

    if _has_any(checked_items, ["큰 소리", "큰소리", "밝은 빛", "밝은빛", "냄새", "신체 접촉", "사람 많은", "사람많음"]):
        sentences.append("불편한 소리나 빛, 사람이 많을 때는 보호자에게 알려도 괜찮아요.")

    if _has_any(checked_items, ["버스", "지하철", "도보", "차량", "이동", "환승"]):
        sentences.append("이동할 때는 보호자 손을 잡고 천천히 따라가요.")

    if _has_any(checked_items, ["일정변경", "예정과 다른", "시간압박", "새로운장소", "새로운 장소"]):
        sentences.append("예정과 다른 일이 생겨도 보호자가 옆에서 도와줄 거예요.")

    if predicted_warnings:
        sentences.append("오늘은 미리 조심하면 더 편안하게 보낼 수 있어요.")

    if story_difficulty == "high":
        sentences.append("힘들면 잠깐 쉬어도 괜찮고, 보호자에게 도와달라고 말할 수 있어요.")

    sentences.append("끝나면 잘 해낸 나를 칭찬해요.")
    sentences = list(dict.fromkeys(sentences))
    return " ".join(_limit_by_difficulty(sentences, story_difficulty, "kind"))


def _strict_story(
    script: str,
    checked_items: list[str],
    predicted_warnings: list[str],
    story_category: str,
    story_difficulty: str,
) -> str:
    sentences = [script.strip()]
    sentences.append(_category_sentence(story_category, "strict"))

    if _has_any(checked_items, ["병원", "진료", "검사", "주사", "치료"]):
        sentences.append("병원에서는 순서를 기다리고 안내에 따라 움직입니다.")

    if _has_any(checked_items, ["대기", "기다리기"]):
        sentences.append("기다리는 동안 자리에서 차분히 기다립니다.")

    if _has_any(checked_items, ["큰 소리", "큰소리", "밝은 빛", "밝은빛", "냄새", "신체 접촉", "사람 많은", "사람많음"]):
        sentences.append("불편한 자극이 있으면 뛰지 말고 보호자에게 말합니다.")

    if _has_any(checked_items, ["버스", "지하철", "도보", "차량", "이동", "환승"]):
        sentences.append("이동할 때는 보호자 가까이에 있고 규칙을 지킵니다.")

    if _has_any(checked_items, ["일정변경", "예정과 다른", "시간압박", "새로운장소", "새로운 장소"]):
        sentences.append("일정이 바뀌면 보호자의 설명을 듣고 다음 행동을 따라갑니다.")

    if predicted_warnings:
        sentences.append("주의가 필요한 상황을 미리 확인하고 차분히 행동합니다.")

    if story_difficulty == "high":
        sentences.append("불편하거나 위험하면 멈추고 보호자에게 도움을 요청합니다.")

    sentences = list(dict.fromkeys(sentences))
    return " ".join(_limit_by_difficulty(sentences, story_difficulty, "strict"))


def convert_tone(
    script: str,
    tone: str,
    checked_items: list[str] | None = None,
    predicted_warnings: list[str] | None = None,
    story_category: str = "general",
    story_difficulty: str = "low",
) -> str:
    checked_items = checked_items or []
    predicted_warnings = predicted_warnings or []

    if not checked_items and not predicted_warnings:
        return script

    if tone == "strict":
        return _strict_story(
            script,
            checked_items,
            predicted_warnings,
            story_category,
            story_difficulty,
        )

    return _kind_story(
        script,
        checked_items,
        predicted_warnings,
        story_category,
        story_difficulty,
    )
