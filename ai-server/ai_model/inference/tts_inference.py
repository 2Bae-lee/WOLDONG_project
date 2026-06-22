from pathlib import Path
import re
from tempfile import TemporaryDirectory

from ai_model.configs.tts_config import (
    FEMALE_CHECKPOINT_PATH,
    MALE_CHECKPOINT_PATH,
)
from ai_model.preprocessing.text import text_to_sequence


_MODEL_CACHE = {}
MAX_CHARS_PER_SEGMENT = 35


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


def _split_text(text: str) -> list[str]:
    sentences = [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?。！？.])\s+|(?<=[.!?。！？.])", text)
        if sentence.strip()
    ]

    if not sentences:
        sentences = [text.strip()]

    segments = []
    for sentence in sentences:
        if len(sentence) <= MAX_CHARS_PER_SEGMENT:
            segments.append(sentence)
            continue

        for start in range(0, len(sentence), MAX_CHARS_PER_SEGMENT):
            segment = sentence[start:start + MAX_CHARS_PER_SEGMENT].strip()
            if segment:
                segments.append(segment)

    return segments


def _generate_segment(model, text: str, output_path: str) -> str:
    sequence = text_to_sequence(text)

    if not sequence:
        raise ValueError("text must not be empty")

    import torch

    from ai_model.preprocessing.audio import mel_to_wav

    text_tensor = torch.tensor(sequence, dtype=torch.long).unsqueeze(0)

    with torch.no_grad():
        mel = model.inference(text_tensor)

    return mel_to_wav(mel, output_path)


def generate_tts_audio(text: str, output_path: str, voice: str = "female") -> str:
    model = _load_model(voice)
    segments = _split_text(text)

    if len(segments) == 1:
        return _generate_segment(model, segments[0], output_path)

    from ai_model.preprocessing.audio import concatenate_wavs

    with TemporaryDirectory() as temp_dir:
        temp_root = Path(temp_dir)
        segment_paths = []

        for index, segment in enumerate(segments):
            segment_path = temp_root / f"segment_{index}.wav"
            segment_paths.append(
                _generate_segment(model, segment, str(segment_path))
            )

        return concatenate_wavs(segment_paths, output_path)
