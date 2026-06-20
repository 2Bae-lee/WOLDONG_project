from pathlib import Path
import os
import sys

import joblib
import numpy as np
import pandas as pd


if sys.platform == "win32":
    scripts_dir = Path(sys.executable).resolve().parent
    if hasattr(os, "add_dll_directory"):
        os.add_dll_directory(str(scripts_dir))
    try:
        import msvc_runtime  # noqa: F401
    except ImportError:
        pass

from tensorflow.keras.models import load_model


MODEL_DIR = Path(__file__).resolve().parent

# 모델 파일 불러오기
model = load_model(MODEL_DIR / "final_warning_model.h5")
input_cols = joblib.load(MODEL_DIR / "final_input_columns.pkl")
target_cols = joblib.load(MODEL_DIR / "final_target_columns.pkl")

warning_templates = {
    "출력_최종주의수준_낮음": "오늘 일정의 전체 주의 수준은 낮은 편입니다.",
    "출력_최종주의수준_보통": "오늘 일정의 전체 주의 수준은 보통입니다.",
    "출력_최종주의수준_높음": "오늘 일정의 전체 주의 수준이 높을 수 있습니다.",
    "출력_최종_대기시간사전안내": "아이가 기다리는 상황을 어려워할 수 있으니 대기 시간을 미리 알려주세요.",
    "출력_최종_혼잡환경주의": "사람이 많은 환경을 힘들어할 수 있으니 가능한 한 혼잡한 시간대를 피해 주세요.",
    "출력_최종_소음주의": "큰 소리가 날 수 있는 환경에서는 미리 알려주고 안정할 수 있도록 도와주세요.",
    "출력_최종_밝은빛주의": "밝은 빛이 있는 장소에서는 아이가 불편해하지 않는지 확인해주세요.",
    "출력_최종_냄새주의": "냄새가 강한 장소에서는 아이가 불편해하지 않는지 확인하고 필요하면 잠시 쉬게 해주세요.",
    "출력_최종_신체접촉주의": "신체 접촉이 있을 수 있는 상황은 미리 알려주고 아이가 놀라지 않도록 도와주세요.",
    "출력_최종_새장소사진안내": "새로운 장소에 가기 전 사진이나 그림 자료로 미리 안내해주세요.",
    "출력_최종_이동전사전설명": "장소를 이동하기 전에 어디로 가는지 먼저 설명해주세요.",
    "출력_최종_주사과정반복설명": "주사나 검사 전에는 어떤 순서로 진행되는지 짧게 반복해서 설명해주세요.",
    "출력_최종_진료과정짧게설명": "진료 과정은 아이가 이해하기 쉽게 짧은 문장으로 설명해주세요.",
    "출력_최종_일정변경미리안내": "일정이 바뀔 가능성이 있다면 아이에게 미리 설명해주세요.",
    "출력_최종_보호자동행강화": "일정 중 보호자 또는 동행자가 아이 가까이에서 지속적으로 확인해주세요.",
    "출력_최종_감정상태자주확인": "아이가 불편함을 말로 표현하기 어려울 수 있으니 표정과 행동을 자주 확인해주세요.",
    "출력_최종_짧고쉬운설명": "아이에게 짧고 쉬운 문장으로 설명해주세요.",
    "출력_최종_시각자료활용": "말로만 설명하기보다 그림, 사진, 카드 같은 시각자료를 함께 활용해주세요.",
    "출력_최종_선택지로질문": "질문할 때는 선택지를 제시해 아이가 고르기 쉽게 해주세요.",
    "출력_최종_시간압박완화": "시간을 재촉하면 아이가 불안해할 수 있으니 여유 있게 진행해주세요.",
    "출력_최종_분리상황주의": "보호자와 떨어지는 상황이 있다면 미리 알려주고 안심할 수 있도록 설명해주세요.",
    "출력_최종_규칙수행지원": "규칙을 지켜야 하는 상황에서는 해야 할 행동을 하나씩 구체적으로 알려주세요.",
    "출력_최종_보상활용": "일정을 잘 마친 뒤 받을 수 있는 보상이나 긍정적인 결과를 미리 알려주세요.",
}


def predict_warnings(checked_items, threshold=0.5):
    # 전체 입력값 0으로 초기화
    input_data = pd.DataFrame(
        np.zeros((1, len(input_cols))),
        columns=input_cols,
    )

    # 체크된 항목만 1로 변경
    for item in checked_items:
        if item in input_data.columns:
            input_data[item] = 1

    # 모델 예측
    pred = model.predict(input_data, verbose=0)
    pred_result = (pred >= threshold).astype(int)

    # 출력 문장 변환
    warnings = []

    for i, col in enumerate(target_cols):
        if pred_result[0][i] == 1:
            warnings.append(warning_templates[col])

    return warnings
