from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DATASET_PATH = BASE_DIR / "social_story_dataset.csv"
DEFAULT_MODEL_PATH = BASE_DIR / "social_story_model.pkl"


def _make_text(row):
    return f"{row['tone']} {row['checked_items']}"


def train_social_story_model(
    dataset_path: str = str(DEFAULT_DATASET_PATH),
    model_path: str = str(DEFAULT_MODEL_PATH),
) -> str:
    data = pd.read_csv(dataset_path)
    data["input_text"] = data.apply(_make_text, axis=1)

    model = Pipeline([
        ("tfidf", TfidfVectorizer(token_pattern=r"[^| ]+")),
        ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
    ])

    if len(data) >= 10 and data["category"].nunique() > 1:
        train_x, test_x, train_y, test_y = train_test_split(
            data["input_text"],
            data["category"],
            test_size=0.25,
            random_state=42,
            stratify=data["category"] if data["category"].value_counts().min() > 1 else None,
        )
        model.fit(train_x, train_y)
        pred_y = model.predict(test_x)
        print(classification_report(test_y, pred_y, zero_division=0))
    else:
        model.fit(data["input_text"], data["category"])

    output_path = Path(model_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output_path)

    print(f"dataset size: {len(data)}")
    print(f"categories: {sorted(data['category'].unique())}")
    print(f"saved model: {output_path}")
    return str(output_path)


if __name__ == "__main__":
    train_social_story_model()
