from pathlib import Path
from uuid import uuid4


BASE_DIR = Path(__file__).resolve().parents[2]
AUDIO_DIR = BASE_DIR / "app" / "static" / "audio"


def synthesize_speech(text: str, voice: str = "female") -> str:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    output_path = AUDIO_DIR / f"social_story_{uuid4().hex}.wav"

    try:
        from ai_model.inference.tts_inference import generate_tts_audio
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "TTS inference dependency is missing. Install torch and torchaudio."
        ) from exc

    return generate_tts_audio(
        text=text,
        output_path=str(output_path),
        voice=voice,
    )
