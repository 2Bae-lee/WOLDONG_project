# Social Story TTS Colab Guide

This project only runs inference locally. Train the TTS checkpoints in Google
Colab, then copy the trained files into this repository.

## Expected Checkpoints

- `ai_model/checkpoints/female_tts.pt`
- `ai_model/checkpoints/male_tts.pt`

The FastAPI server loads these files at request time. If a checkpoint is
missing, `/social-story/tts` returns a clear error instead of crashing the
server.

## Dataset Notes

- Use KSS or another Korean speech dataset for the female voice.
- For a male voice, prepare paired `wav + text` data and train a separate
  checkpoint as `male_tts.pt`.
- The same source files used here must be used in Colab:
  - `ai_model/models/simple_tacotron.py`
  - `ai_model/preprocessing/text.py`
  - `ai_model/preprocessing/audio.py`

The tokenizer vocabulary must stay identical between training and inference.
Changing `text.py` after training can make old checkpoints incompatible.

## Local Inference Flow

1. FastAPI receives `script`, `tone`, `speed`, and `voice`.
2. `app/services/story_style.py` converts the tone.
3. `ai_model/inference/tts_inference.py` loads the matching checkpoint.
4. `SimpleTacotron` generates a mel-spectrogram.
5. `mel_to_wav` writes the generated `.wav`.
6. `app/services/audio_speed.py` optionally adjusts speed with ffmpeg.
