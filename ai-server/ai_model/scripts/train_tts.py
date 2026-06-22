import argparse
import csv
import time
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset
from tqdm.auto import tqdm

from ai_model.models.simple_tacotron import SimpleTacotron
from ai_model.preprocessing.audio import wav_to_mel
from ai_model.preprocessing.text import text_to_sequence


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
    text_list = []
    mel_list = []

    for text, mel in batch:
        # Normalize text shape.
        text_list.append(text)

        # Normalize mel shape from [channel, n_mels, time] to [n_mels, time].
        if mel.dim() == 3:
            mel = mel.mean(dim=0)

        # Convert [time, n_mels] to [n_mels, time] when needed.
        if mel.dim() == 2 and mel.size(0) != 80 and mel.size(1) == 80:
            mel = mel.transpose(0, 1)

        mel_list.append(mel)

    max_text_len = max(text.size(0) for text in text_list)
    max_mel_len = max(mel.size(1) for mel in mel_list)

    text_batch = torch.zeros(len(batch), max_text_len, dtype=torch.long)
    mel_batch = torch.zeros(len(batch), 80, max_mel_len)

    for index, text in enumerate(text_list):
        text_batch[index, : text.size(0)] = text

    for index, mel in enumerate(mel_list):
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

    print(f"dataset size: {len(dataset)}")
    print(f"batch size: {loader.batch_size}")
    print(f"batches per epoch: {len(loader)}")
    print(f"total expected steps: {len(loader) * epochs}")
    print(f"checkpoint path: {checkpoint_path}")

    model = SimpleTacotron().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.L1Loss()

    output_path = Path(checkpoint_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    model.train()
    total_steps = epochs * len(loader)
    global_step = 0
    start_time = time.time()

    overall_progress = tqdm(
        total=total_steps,
        desc="total training progress",
        unit="batch",
    )

    for epoch in range(epochs):
        epoch_loss = 0.0
        epoch_start_time = time.time()
        epoch_step = 0

        for text_batch, mel_batch in loader:
            text_batch = text_batch.to(device)
            mel_batch = mel_batch.to(device)

            optimizer.zero_grad()

            mel_pred = model(text_batch, mel_batch)
            mel_pred = match_mel_length(mel_pred, mel_batch)
            loss = criterion(mel_pred, mel_batch)

            loss.backward()
            optimizer.step()

            loss_value = loss.item()
            epoch_loss += loss_value
            global_step += 1
            epoch_step += 1

            elapsed = time.time() - start_time
            avg_time_per_step = elapsed / global_step
            remaining_steps = total_steps - global_step
            eta_seconds = avg_time_per_step * remaining_steps

            overall_progress.update(1)
            overall_progress.set_postfix({
                "epoch": f"{epoch + 1}/{epochs}",
                "loss": f"{loss_value:.4f}",
                "avg_loss": f"{epoch_loss / epoch_step:.4f}",
                "ETA_min": f"{eta_seconds / 60:.1f}",
            })

        epoch_time = time.time() - epoch_start_time
        avg_epoch_loss = epoch_loss / max(len(loader), 1)

        print(
            f"Epoch {epoch + 1}/{epochs} complete | "
            f"avg_loss={avg_epoch_loss:.4f} | "
            f"epoch_time={epoch_time / 60:.1f}min"
        )

        torch.save({
            "epoch": epoch + 1,
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "loss": avg_epoch_loss,
            "state_dict": model.state_dict(),
        }, output_path)

        print(f"Checkpoint saved: {output_path}")

    overall_progress.close()
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
