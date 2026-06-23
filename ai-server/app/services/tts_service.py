import hashlib
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI, OpenAIError


BASE_DIR = Path(__file__).resolve().parents[2]
AUDIO_DIR = BASE_DIR / "app" / "static" / "audio"
load_dotenv(BASE_DIR / ".env")

OPENAI_TTS_MODEL = "gpt-4o-mini-tts"
VOICE_MAP = {
    "female": "coral",
    "male": "onyx",
}
SPEED_MAP = {
    "slow": 0.85,
    "normal": 1.0,
    "fast": 1.15,
}


def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set.")

    return OpenAI(api_key=api_key)


def build_tts_instructions(tone: str, speed: str) -> str:
    base = (
        "Read in Korean. Perform the line like a friendly children's animation character "
        "talking directly to a young child. Use a bright, lively, very human voice with "
        "clear emotional expression, playful pitch movement, and warm reassurance. "
        "Do not add, remove, or rewrite any words from the input text."
    )

    tone_instructions = {
        "kind": (
            "Make the voice sound cute, animated, and emotionally expressive. "
            "Use a smiling tone, gentle excitement, warm ups and downs in pitch, and soft playful pauses. "
            "Imagine a kind cartoon friend encouraging a child: safe, cheerful, affectionate, and never scary. "
            "Do not sound strict, flat, formal, clinical, robotic, like a public announcement, or like a teacher giving orders."
        ),
        "strict": (
            "Use a calm, clear, directive tone. Be firm but not scary."
        ),
    }

    speed_instructions = {
        "slow": "Speak slowly with slightly longer pauses between short phrases.",
        "normal": "Speak at a natural, easy-to-follow pace.",
        "fast": "Speak a little faster, but keep pronunciation clear.",
    }

    return " ".join([
        base,
        tone_instructions.get(tone, tone_instructions["kind"]),
        speed_instructions.get(speed, speed_instructions["normal"]),
    ])


def _cache_path(text: str, voice: str, tone: str, speed: str, instructions: str) -> Path:
    cache_key = "|".join([
        OPENAI_TTS_MODEL,
        voice,
        tone,
        speed,
        instructions,
        text,
    ])
    digest = hashlib.sha256(cache_key.encode("utf-8")).hexdigest()[:24]
    return AUDIO_DIR / f"social_story_{digest}.wav"


def synthesize_speech(
    text: str,
    voice: str = "female",
    tone: str = "kind",
    speed: str = "normal",
) -> str:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    openai_voice = VOICE_MAP.get(voice)
    openai_speed = SPEED_MAP.get(speed)

    if openai_voice is None:
        raise ValueError("voice must be female or male")

    if openai_speed is None:
        raise ValueError("speed must be slow, normal, or fast")

    instructions = build_tts_instructions(tone=tone, speed=speed)
    output_path = _cache_path(
        text=text,
        voice=voice,
        tone=tone,
        speed=speed,
        instructions=instructions,
    )

    if output_path.exists():
        return str(output_path)

    client = get_openai_client()

    try:
        response = client.audio.speech.create(
            model=OPENAI_TTS_MODEL,
            voice=openai_voice,
            input=text,
            instructions=instructions,
            response_format="wav",
            speed=openai_speed,
        )
    except OpenAIError as exc:
        raise RuntimeError(f"OpenAI TTS request failed: {exc}") from exc

    response.write_to_file(output_path)
    return str(output_path)
