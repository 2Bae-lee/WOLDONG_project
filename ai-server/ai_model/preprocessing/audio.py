from pathlib import Path

import torch

from ai_model.configs.tts_config import (
    HOP_LENGTH,
    N_FFT,
    N_MELS,
    SAMPLE_RATE,
    WIN_LENGTH,
)


def _load_torchaudio():
    try:
        import torchaudio
    except Exception as exc:
        raise RuntimeError(
            "torchaudio is required for local TTS audio conversion."
        ) from exc

    return torchaudio


def wav_to_mel(wav_path: str):
    torchaudio = _load_torchaudio()
    waveform, sample_rate = torchaudio.load(wav_path)

    if waveform.size(0) > 1:
        waveform = waveform.mean(dim=0, keepdim=True)

    if sample_rate != SAMPLE_RATE:
        waveform = torchaudio.functional.resample(
            waveform,
            orig_freq=sample_rate,
            new_freq=SAMPLE_RATE,
        )

    transform = torchaudio.transforms.MelSpectrogram(
        sample_rate=SAMPLE_RATE,
        n_fft=N_FFT,
        hop_length=HOP_LENGTH,
        win_length=WIN_LENGTH,
        n_mels=N_MELS,
    )

    mel = transform(waveform).squeeze(0)

    if mel.dim() == 2 and mel.size(0) != N_MELS and mel.size(1) == N_MELS:
        mel = mel.transpose(0, 1)

    return mel


def mel_to_wav(mel, output_path: str):
    torchaudio = _load_torchaudio()
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    if not isinstance(mel, torch.Tensor):
        mel = torch.tensor(mel, dtype=torch.float32)

    mel = mel.detach().cpu().float()
    if mel.dim() == 3:
        mel = mel.squeeze(0)

    inverse_mel = torchaudio.transforms.InverseMelScale(
        n_stft=(N_FFT // 2) + 1,
        n_mels=N_MELS,
        sample_rate=SAMPLE_RATE,
    )
    griffin_lim = torchaudio.transforms.GriffinLim(
        n_fft=N_FFT,
        hop_length=HOP_LENGTH,
        win_length=WIN_LENGTH,
    )

    spectrogram = inverse_mel(mel.clamp_min(1e-6))
    waveform = griffin_lim(spectrogram).unsqueeze(0)
    torchaudio.save(str(output), waveform, SAMPLE_RATE)

    return str(output)


def concatenate_wavs(wav_paths: list[str], output_path: str, silence_seconds: float = 0.2):
    torchaudio = _load_torchaudio()
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    chunks = []
    silence = torch.zeros(1, int(SAMPLE_RATE * silence_seconds))

    for wav_path in wav_paths:
        waveform, sample_rate = torchaudio.load(wav_path)

        if waveform.size(0) > 1:
            waveform = waveform.mean(dim=0, keepdim=True)

        if sample_rate != SAMPLE_RATE:
            waveform = torchaudio.functional.resample(
                waveform,
                orig_freq=sample_rate,
                new_freq=SAMPLE_RATE,
            )

        chunks.append(waveform)
        chunks.append(silence)

    if not chunks:
        raise ValueError("wav_paths must not be empty")

    combined = torch.cat(chunks[:-1], dim=1)
    torchaudio.save(str(output), combined, SAMPLE_RATE)

    return str(output)
