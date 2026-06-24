import base64
import re
from pathlib import Path
from uuid import uuid4

from app.services.character_service import get_openai_client


BASE_DIR = Path(__file__).resolve().parents[2]
STORY_IMAGE_DIR = BASE_DIR / "app" / "static" / "story-images"
MAX_STORY_IMAGES = 3


def _split_scenes(script: str) -> list[str]:
    sentences = [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?])\s+", script.strip())
        if sentence.strip()
    ]
    return sentences[:MAX_STORY_IMAGES] or [script.strip()]


def generate_story_images(script: str) -> list[str]:
    STORY_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    client = get_openai_client()
    story_id = uuid4().hex[:12]
    image_urls: list[str] = []

    for index, scene in enumerate(_split_scenes(script), start=1):
        prompt = f"""
        Create a single scene for a children's social story.

        Scene:
        {scene}

        Style:
        warm Korean children's storybook illustration, soft pastel colors,
        clear facial expressions, simple uncluttered composition,
        child-friendly and reassuring, consistent visual style,
        no text, no letters, no logo, no watermark.
        """

        result = client.images.generate(
            model="gpt-image-1",
            prompt=prompt,
            size="1024x1024",
            quality="low",
        )
        image_bytes = base64.b64decode(result.data[0].b64_json)
        filename = f"story_{story_id}_{index}.png"
        (STORY_IMAGE_DIR / filename).write_bytes(image_bytes)
        image_urls.append(f"/static/story-images/{filename}")

    return image_urls
