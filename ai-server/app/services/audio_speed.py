import subprocess
from pathlib import Path
from shutil import which


SPEED_RATES = {
    "slow": 0.85,
    "normal": 1.0,
    "fast": 1.15,
}


def change_audio_speed(input_path: str, speed: str) -> str:
    if speed not in SPEED_RATES:
        raise ValueError("speed must be one of: slow, normal, fast")

    if speed == "normal":
        return input_path

    if which("ffmpeg") is None:
        # TODO: Install ffmpeg to enable real audio speed conversion.
        return input_path

    source_path = Path(input_path)
    output_path = source_path.with_name(
        f"{source_path.stem}_{speed}{source_path.suffix}"
    )

    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(source_path),
        "-filter:a",
        f"atempo={SPEED_RATES[speed]}",
        str(output_path),
    ]

    try:
        subprocess.run(command, check=True, capture_output=True)
    except (OSError, subprocess.CalledProcessError):
        return input_path

    return str(output_path)
