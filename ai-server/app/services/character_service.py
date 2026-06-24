from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path

import os
import base64
import time
from uuid import uuid4

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")
STATIC_DIR = BASE_DIR / "app" / "static"
CHARACTER_DIR = STATIC_DIR / "characters"

#이게 프롬프트인데 이거 수정하면 됨
BASE_STYLE = """
cute pastel mascot character,
children storybook illustration,
soft watercolor style,
big sparkling eyes,
simple cute face,
soft rounded body,
light pastel colors,
minimal clean design,
plain solid #FFFBEF background,
no background objects,
no text,
no logo
"""


def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise ValueError("OPENAI_API_KEY가 설정되어 있지 않습니다.")

    return OpenAI(api_key=api_key)


def create_character_image(traits: str) -> str:
    prompt = f"""
    {traits}

    {BASE_STYLE}

    IMPORTANT:
    Clearly reflect all requested colors and accessories.
    Make the character cute, clean, child-friendly, and pastel toned.
    """

    client = get_openai_client()

    result = client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        size="1024x1024",
        quality="low"
    )

    image_base64 = result.data[0].b64_json
    image_bytes = base64.b64decode(image_base64)

    filename = f"character_{int(time.time())}.png"

    with open(filename, "wb") as f:
        f.write(image_bytes)

    return filename


FRAME_PROMPTS = {
    "idle": "neutral happy face, mouth closed, eyes open",
    "blink": "same character, eyes gently closed, mouth closed, peaceful blink",
    "mouth_open": "same character, eyes open, small friendly open mouth as if speaking",
    "mouth_wide": "same character, eyes open, wider cheerful open mouth as if saying a bright vowel sound",
    "smile": "same character, big warm smile, mouth slightly open, encouraging expression",
}


def _generate_character_frame(client, traits: str, expression: str, output_path: Path):
    prompt = f"""
    Create one clean character animation frame.

    Character description:
    {traits}

    Expression for this frame:
    {expression}

    Shared style:
    {BASE_STYLE}

    IMPORTANT:
    Keep the same character identity, colors, accessories, body shape, camera angle,
    scale, pose, and plain background across all frames.
    Only change the eyes and mouth expression requested for this frame.
    The image must be centered and suitable for frame-by-frame talking animation.
    """

    result = client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        size="1024x1024",
        quality="low",
    )

    image_base64 = result.data[0].b64_json
    image_bytes = base64.b64decode(image_base64)
    output_path.write_bytes(image_bytes)


def create_character_frames(traits: str) -> dict[str, str]:
    CHARACTER_DIR.mkdir(parents=True, exist_ok=True)

    client = get_openai_client()
    character_id = uuid4().hex[:12]
    frame_urls = {}

    for frame_name, expression in FRAME_PROMPTS.items():
        filename = f"character_{character_id}_{frame_name}.png"
        output_path = CHARACTER_DIR / filename
        _generate_character_frame(client, traits, expression, output_path)
        frame_urls[frame_name] = f"/static/characters/{filename}"

    return frame_urls
