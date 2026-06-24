import base64
from pathlib import Path
from uuid import uuid4

from app.services.character_service import get_openai_client


BASE_DIR = Path(__file__).resolve().parents[2]
STORY_IMAGE_DIR = BASE_DIR / "app" / "static" / "story-images"


def generate_story_images(script: str) -> list[str]:
    STORY_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    client = get_openai_client()
    story_id = uuid4().hex[:12]
    prompt = f"""
    Create one representative scene for a children's social story.

    Full story:
    {script.strip()}

    Style:
    warm Korean children's storybook illustration, soft pastel colors,
    clear facial expressions, simple uncluttered composition,
    child-friendly and reassuring,
    no text, no letters, no logo, no watermark.
    """

    result = client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        size="1024x1024",
        quality="low",
    )
    image_bytes = base64.b64decode(result.data[0].b64_json)
    filename = f"story_{story_id}.png"
    (STORY_IMAGE_DIR / filename).write_bytes(image_bytes)

    return [f"/static/story-images/{filename}"]
