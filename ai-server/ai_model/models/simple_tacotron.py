import torch
from torch import nn

from ai_model.configs.tts_config import (
    DECODER_DIM,
    EMBEDDING_DIM,
    ENCODER_DIM,
    N_MELS,
    VOCAB_SIZE,
)


class SimpleTacotron(nn.Module):
    def __init__(self):
        super().__init__()
        self.embedding = nn.Embedding(VOCAB_SIZE, EMBEDDING_DIM, padding_idx=0)
        self.encoder = nn.LSTM(
            input_size=EMBEDDING_DIM,
            hidden_size=ENCODER_DIM,
            batch_first=True,
            bidirectional=True,
        )
        self.decoder = nn.LSTM(
            input_size=ENCODER_DIM * 2,
            hidden_size=DECODER_DIM,
            batch_first=True,
        )
        self.mel_projection = nn.Linear(DECODER_DIM, N_MELS)
        self.postnet = nn.Sequential(
            nn.Conv1d(N_MELS, N_MELS, kernel_size=5, padding=2),
            nn.Tanh(),
            nn.Conv1d(N_MELS, N_MELS, kernel_size=5, padding=2),
        )

    def _resize_time(self, encoded, target_len):
        encoded = encoded.transpose(1, 2)
        encoded = nn.functional.interpolate(
            encoded,
            size=target_len,
            mode="linear",
            align_corners=False,
        )
        return encoded.transpose(1, 2)

    def forward(self, text_sequences, mel_targets=None, teacher_forcing_ratio=1.0):
        embedded = self.embedding(text_sequences)
        encoded, _ = self.encoder(embedded)

        if mel_targets is not None:
            encoded = self._resize_time(encoded, mel_targets.size(2))

        decoded, _ = self.decoder(encoded)
        mel = self.mel_projection(decoded).transpose(1, 2)
        refined = self.postnet(mel)
        return (mel + refined).clamp_min(1e-6)

    @torch.no_grad()
    def inference(self, text_sequence, max_len=500):
        if text_sequence.dim() == 1:
            text_sequence = text_sequence.unsqueeze(0)

        target_len = min(max(text_sequence.size(1) * 8, 40), max_len)
        dummy_targets = text_sequence.new_zeros(
            (text_sequence.size(0), N_MELS, target_len),
            dtype=torch.float32,
        )
        mel = self.forward(text_sequence, dummy_targets)

        return mel
