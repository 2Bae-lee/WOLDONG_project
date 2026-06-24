import argparse
from pathlib import Path

from ai_model.inference.tts_inference import generate_tts_audio


def main():
    parser = argparse.ArgumentParser(description="Test local TTS inference.")
    parser.add_argument("--text", default="괜찮아요. 천천히 해도 돼요.")
    parser.add_argument("--voice", choices=["female", "male"], default="female")
    parser.add_argument("--output", default="app/static/audio/test_social_story.wav")
    args = parser.parse_args()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    result = generate_tts_audio(
        text=args.text,
        output_path=str(output_path),
        voice=args.voice,
    )
    print(f"Generated audio: {result}")


if __name__ == "__main__":
    main()
