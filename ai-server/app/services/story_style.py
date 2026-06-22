def convert_tone(script: str, tone: str) -> str:
    if tone == "kind":
        return f"괜찮아요. 천천히 해도 돼요. {script} 우리 함께 해볼까요?"

    if tone == "strict":
        return f"{script} 지금 해야 할 일을 차분히 따라하세요."

    return script
