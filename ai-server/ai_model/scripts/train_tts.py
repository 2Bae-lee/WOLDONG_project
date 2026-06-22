import argparse
import csv
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm

from ai_model.models.simple_tacotron import SimpleTacotron
from ai_model.preprocessing.audio import wav_to_mel
from ai_model.preprocessing.text import PAD_TOKEN_ID, text_to_sequence


class TTSDataset(Dataset):
    def __init__(self, metadata_csv: str):
        self.items = []
        with Path(metadata_csv).open("r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                self.items.append((row["wav_path"], row["text"]))

    def __len__(self):
        return len(self.items)

    def __getitem__(self, index):
        wav_path, text = self.items[index]
        text_sequence = torch.tensor(text_to_sequence(text), dtype=torch.long)
        mel = wav_to_mel(wav_path).float()
        return text_sequence, mel


def collate_batch(batch):
    texts, mels = zip(*batch)
    max_text_len = max(text.size(0) for text in texts)
    max_mel_len = max(mel.size(1) for mel in mels)
    n_mels = mels[0].size(0)

    text_batch = torch.full(
        (len(batch), max_text_len),
        PAD_TOKEN_ID,
        dtype=torch.long,
    )
    mel_batch = torch.zeros(len(batch), n_mels, max_mel_len)

    for index, (text, mel) in enumerate(batch):
        text_batch[index, : text.size(0)] = text
        mel_batch[index, :, : mel.size(1)] = mel

    return text_batch, mel_batch


def match_mel_length(predicted, target):
    if predicted.size(2) == target.size(2):
        return predicted

    if predicted.size(2) > target.size(2):
        return predicted[:, :, : target.size(2)]

    padding = target.size(2) - predicted.size(2)
    return nn.functional.pad(predicted, (0, padding))


def train_tts(metadata_csv: str, checkpoint_path: str, epochs: int, batch_size: int, lr: float):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    dataset = TTSDataset(metadata_csv)
    loader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=True,
        collate_fn=collate_batch,
    )

    model = SimpleTacotron().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.L1Loss()

    model.train()
    for epoch in range(epochs):
        total_loss = 0.0
        progress = tqdm(loader, desc=f"epoch {epoch + 1}/{epochs}")

        for text_batch, mel_batch in progress:
            text_batch = text_batch.to(device)
            mel_batch = mel_batch.to(device)

            predicted = model(text_batch)
            predicted = match_mel_length(predicted, mel_batch)
            loss = criterion(predicted, mel_batch)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            progress.set_postfix(loss=loss.item())

        print(f"epoch={epoch + 1} loss={total_loss / max(len(loader), 1):.4f}")

    output_path = Path(checkpoint_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save({"state_dict": model.state_dict()}, output_path)
    return str(output_path)


def main():
    parser = argparse.ArgumentParser(description="Train SimpleTacotron checkpoint.")
    parser.add_argument("--metadata-csv", required=True)
    parser.add_argument("--checkpoint-path", required=True)
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--lr", type=float, default=1e-3)
    args = parser.parse_args()

    checkpoint_path = train_tts(
        metadata_csv=args.metadata_csv,
        checkpoint_path=args.checkpoint_path,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
    )
    print(f"Saved checkpoint: {checkpoint_path}")


if __name__ == "__main__":
    main()
