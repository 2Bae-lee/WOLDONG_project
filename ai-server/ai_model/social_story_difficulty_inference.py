from pathlib import Path

import joblib


MODEL_DIR = Path(__file__).resolve().parent
MODEL_PATH = MODEL_DIR / "social_story_difficulty_model.pkl"

_model = None


def _make_text(checked_items: list[str], tone: str) -> str:
    return f"{tone} {'|'.join(checked_items)}"


def get_social_story_difficulty_model():
    global _model

    if _model is not None:
        return _model

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Social story difficulty model not found: {MODEL_PATH}. "
            "Run ai_model/scripts/train_social_story_difficulty.py first."
        )

    _model = joblib.load(MODEL_PATH)
    return _model


def predict_social_story_difficulty(checked_items: list[str], tone: str = "kind") -> str:
    if not checked_items:
        return "low"

    model = get_social_story_difficulty_model()
    return str(model.predict([_make_text(checked_items, tone)])[0])
