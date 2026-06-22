from pathlib import Path

from ai_model.configs.tts_config import (
    FEMALE_CHECKPOINT_PATH,
    MALE_CHECKPOINT_PATH,
)
from ai_model.preprocessing.text import text_to_sequence


_MODEL_CACHE = {}


def _checkpoint_path_for_voice(voice: str) -> Path:
    if voice == "female":
        return FEMALE_CHECKPOINT_PATH
    if voice == "male":
        return MALE_CHECKPOINT_PATH
    raise ValueError("voice must be female or male")


def _load_model(voice: str):
    if voice in _MODEL_CACHE:
        return _MODEL_CACHE[voice]

    checkpoint_path = _checkpoint_path_for_voice(voice)
    if not checkpoint_path.exists():
        raise FileNotFoundError(
            f"checkpoint file not found: {checkpoint_path}"
        )

    import torch

    from ai_model.models.simple_tacotron import SimpleTacotron

    model = SimpleTacotron()
    checkpoint = torch.load(
        checkpoint_path,
        map_location=torch.device("cpu"),
    )

    state_dict = checkpoint.get("state_dict", checkpoint)
    model.load_state_dict(state_dict)
    model.eval()

    _MODEL_CACHE[voice] = model
    return model


def generate_tts_audio(text: str, output_path: str, voice: str = "female") -> str:
    model = _load_model(voice)
    sequence = text_to_sequence(text)

    if not sequence:
        raise ValueError("text must not be empty")

    import torch

    from ai_model.preprocessing.audio import mel_to_wav

    text_tensor = torch.tensor(sequence, dtype=torch.long).unsqueeze(0)

    with torch.no_grad():
        mel = model.inference(text_tensor)

    return mel_to_wav(mel, output_path)
