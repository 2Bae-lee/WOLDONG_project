import argparse
import csv
from pathlib import Path


def prepare_kss(kss_root: str, output_csv: str) -> str:
    root = Path(kss_root)
    metadata_path = root / "transcript.v.1.4.txt"
    output_path = Path(output_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if not metadata_path.exists():
        raise FileNotFoundError(f"KSS transcript not found: {metadata_path}")

    rows = []
    with metadata_path.open("r", encoding="utf-8") as source:
        for line in source:
            parts = line.strip().split("|")
            if len(parts) < 2:
                continue

            relative_wav = parts[0]
            text = parts[1]
            wav_path = root / relative_wav

            if wav_path.exists():
                rows.append({"wav_path": str(wav_path), "text": text})

    with output_path.open("w", encoding="utf-8", newline="") as target:
        writer = csv.DictWriter(target, fieldnames=["wav_path", "text"])
        writer.writeheader()
        writer.writerows(rows)

    return str(output_path)


def main():
    parser = argparse.ArgumentParser(description="Prepare KSS metadata for TTS training.")
    parser.add_argument("--kss-root", required=True)
    parser.add_argument("--output-csv", default="ai_model/data/kss_metadata.csv")
    args = parser.parse_args()

    output_path = prepare_kss(args.kss_root, args.output_csv)
    print(f"Prepared metadata: {output_path}")


if __name__ == "__main__":
    main()
