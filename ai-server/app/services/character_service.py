from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path

import os
import base64
import time

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")

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
